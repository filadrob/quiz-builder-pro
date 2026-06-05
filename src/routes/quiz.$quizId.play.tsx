import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuestionView } from "@/components/quiz/QuestionView";
import { FeedbackInterstitial } from "@/components/quiz/FeedbackInterstitial";
import { TimesUpInterstitial } from "@/components/quiz/TimesUpInterstitial";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuizSession } from "@/lib/session-context";
import { useDocumentTitle } from "@/lib/use-document-title";
import { formatScore } from "@/lib/format";
import type { AnswerRecord } from "@/lib/types";

export const Route = createFileRoute("/quiz/$quizId/play")({
  component: PlayPage,
});

type Phase = "question" | "feedback" | "timesup" | "between";

function PlayPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const session = useQuizSession();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [lastAnswer, setLastAnswer] = useState<AnswerRecord | null>(null);
  useDocumentTitle(session.quiz?.title ? `${session.quiz.title} – Playing` : "Playing – Quiz Platform");

  const orderedQuestions = useMemo(() => {
    if (!session.quiz) return [];
    return session.orderedQuestionIds
      .map((id) => session.quiz!.questions.find((q) => q.id === id))
      .filter((q): q is NonNullable<typeof q> => !!q);
  }, [session.quiz, session.orderedQuestionIds]);

  // Redirect to setup if session not initialized
  useEffect(() => {
    if (!session.quiz || !session.settings || orderedQuestions.length === 0) {
      navigate({ to: "/quiz/$quizId", params: { quizId } });
    }
  }, [session.quiz, session.settings, orderedQuestions.length, navigate, quizId]);

  // Preload the next question's image during the pause
  useEffect(() => {
    if (phase !== "between") return;
    const upcoming = orderedQuestions[index + 1];
    if (upcoming?.imageUrl) {
      const img = new Image();
      img.src = upcoming.imageUrl;
    }
  }, [phase, index, orderedQuestions]);

  if (!session.quiz || !session.settings || orderedQuestions.length === 0) return null;

  const current = orderedQuestions[index];
  const next = orderedQuestions[index + 1] ?? null;
  const isLastQuestion = index === orderedQuestions.length - 1;
  const feedbackEnabled = session.settings.perQuestionFeedback;

  const goToResults = () => {
    navigate({ to: "/quiz/$quizId/results", params: { quizId } });
  };

  const finishQuestion = () => {
    if (isLastQuestion) {
      goToResults();
    } else {
      setPhase("between");
    }
  };

  const handleContinue = () => {
    setIndex(index + 1);
    setLastAnswer(null);
    setPhase("question");
  };

  const handleAnswered = (record: AnswerRecord) => {
    session.recordAnswer(record);
    setLastAnswer(record);

    if (record.timedOut) {
      setPhase("timesup");
      setTimeout(finishQuestion, 1200);
      return;
    }
    if (record.skipped) {
      finishQuestion();
      return;
    }
    if (feedbackEnabled) {
      setPhase("feedback");
    } else {
      finishQuestion();
    }
  };

  const totalScore = session.answers.reduce((s, a) => s + a.points, 0);
  const completedCount = phase === "question" ? index : index + 1;
  const progress = (completedCount / orderedQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="truncate font-medium">{session.quiz.title}</span>
            <span>
              {Math.min(index + 1, orderedQuestions.length)} / {orderedQuestions.length}
            </span>
          </div>
          <Progress value={progress} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">
        {phase === "question" && current && (
          <QuestionView
            key={current.id}
            question={current}
            questionIndex={index}
            total={orderedQuestions.length}
            timeLimit={session.quiz.timeLimitSeconds}
            nextImageUrl={next?.imageUrl ?? null}
            onAnswered={handleAnswered}
          />
        )}
        {phase === "feedback" && lastAnswer && (
          <FeedbackInterstitial
            correct={lastAnswer.correct}
            points={lastAnswer.points}
            onContinue={finishQuestion}
          />
        )}
        {phase === "timesup" && <TimesUpInterstitial />}
        {phase === "between" && (
          <PauseScreen
            totalScore={totalScore}
            lastAnswer={lastAnswer}
            feedbackEnabled={feedbackEnabled}
            completed={index + 1}
            total={orderedQuestions.length}
            onContinue={handleContinue}
          />
        )}
      </main>
    </div>
  );
}

function PauseScreen({
  totalScore,
  lastAnswer,
  feedbackEnabled,
  completed,
  total,
  onContinue,
}: {
  totalScore: number;
  lastAnswer: AnswerRecord | null;
  feedbackEnabled: boolean;
  completed: number;
  total: number;
  onContinue: () => void;
}) {
  const showResult = feedbackEnabled && lastAnswer;
  let resultLine: { icon: string; text: string; className: string } | null = null;
  if (showResult && lastAnswer) {
    if (lastAnswer.timedOut) {
      resultLine = {
        icon: "⏱",
        text: `Time's Up. +${lastAnswer.points} pts`,
        className: "text-muted-foreground",
      };
    } else if (lastAnswer.correct) {
      resultLine = {
        icon: "✅",
        text: `Correct! +${lastAnswer.points} pts`,
        className: "text-emerald-600 dark:text-emerald-400",
      };
    } else {
      resultLine = {
        icon: "❌",
        text: `Incorrect. +${lastAnswer.points} pts`,
        className: "text-destructive",
      };
    }
  }

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-6 py-10 text-center">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Score
          </p>
          <p className="text-4xl font-bold tabular-nums">{formatScore(totalScore)}</p>
        </div>

        {resultLine && (
          <p className={`text-lg font-medium ${resultLine.className}`}>
            <span className="mr-2">{resultLine.icon}</span>
            {resultLine.text}
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Question {completed} of {total} complete
        </p>

        <Button size="lg" onClick={onContinue} autoFocus>
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
