import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuestionView } from "@/components/quiz/QuestionView";
import { FeedbackInterstitial } from "@/components/quiz/FeedbackInterstitial";
import { TimesUpInterstitial } from "@/components/quiz/TimesUpInterstitial";
import { Progress } from "@/components/ui/progress";
import { useQuizSession } from "@/lib/session-context";
import type { AnswerRecord } from "@/lib/types";

export const Route = createFileRoute("/quiz/$quizId/play")({
  component: PlayPage,
});

type Phase = "question" | "feedback" | "timesup";

function PlayPage() {
  const { quizId } = Route.useParams();
  const navigate = useNavigate();
  const session = useQuizSession();
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("question");
  const [lastAnswer, setLastAnswer] = useState<AnswerRecord | null>(null);

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

  if (!session.quiz || !session.settings || orderedQuestions.length === 0) return null;

  const current = orderedQuestions[index];
  const next = orderedQuestions[index + 1] ?? null;

  const advance = () => {
    if (index + 1 >= orderedQuestions.length) {
      navigate({ to: "/quiz/$quizId/results", params: { quizId } });
    } else {
      setIndex(index + 1);
      setPhase("question");
      setLastAnswer(null);
    }
  };

  const handleAnswered = (record: AnswerRecord) => {
    session.recordAnswer(record);
    setLastAnswer(record);

    if (record.timedOut) {
      setPhase("timesup");
      setTimeout(advance, 1200);
      return;
    }
    if (record.skipped) {
      advance();
      return;
    }
    if (session.settings!.perQuestionFeedback) {
      setPhase("feedback");
    } else {
      advance();
    }
  };

  const progress = ((index + (phase === "question" ? 0 : 1)) / orderedQuestions.length) * 100;

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
            onContinue={advance}
          />
        )}
        {phase === "timesup" && <TimesUpInterstitial />}
      </main>
    </div>
  );
}
