import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { QuestionView } from "@/components/quiz/QuestionView";
import { FeedbackInterstitial } from "@/components/quiz/FeedbackInterstitial";
import { TimesUpInterstitial } from "@/components/quiz/TimesUpInterstitial";
import { MakoBar, MakoButton, MakoPanel, ThemeToggle } from "@/components/mako";
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

  useEffect(() => {
    if (!session.quiz || !session.settings || orderedQuestions.length === 0) {
      navigate({ to: "/quiz/$quizId", params: { quizId } });
    }
  }, [session.quiz, session.settings, orderedQuestions.length, navigate, quizId]);

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

  const goToResults = () => navigate({ to: "/quiz/$quizId/results", params: { quizId } });

  const finishQuestion = () => {
    if (isLastQuestion) goToResults();
    else setPhase("between");
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
    if (record.skipped) { finishQuestion(); return; }
    if (feedbackEnabled) setPhase("feedback");
    else finishQuestion();
  };

  const totalScore = session.answers.reduce((s, a) => s + a.points, 0);
  const completedCount = phase === "question" ? index : index + 1;
  const progress = completedCount / orderedQuestions.length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3">
        <div className="mx-auto max-w-3xl flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <MakoBar
              channel={quizId}
              guild={session.quiz.title}
              online={Math.min(index + 1, orderedQuestions.length)}
              className="flex-1"
            />
            {session.testMode && (
              <span
                className="clip-mako px-2 py-1 text-[10px] tracking-widest uppercase"
                style={{
                  fontFamily: 'var(--font-mono-mako)',
                  background: 'var(--mako-panel)',
                  boxShadow: 'inset 0 0 0 1px var(--mako-amber)',
                  color: 'var(--mako-amber)',
                }}
              >
                TEST PLAY
              </span>
            )}
            <ThemeToggle />
          </div>
          {/* Progress bar */}
          <div
            className="h-[3px] w-full clip-mako overflow-hidden"
            style={{ background: 'var(--mako-line-soft)' }}
          >
            <div
              className="h-full transition-[width] duration-300"
              style={{
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, var(--mako-teal), var(--mako-correct))',
                boxShadow: '0 0 8px var(--mako-teal)',
              }}
            />
          </div>
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
            responseTime={lastAnswer.responseTime}
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
  let resultColor = 'var(--mako-sub)';
  let resultText = '';
  if (showResult && lastAnswer) {
    if (lastAnswer.timedOut) {
      resultColor = 'var(--mako-amber)';
      resultText = `⏱ TIME'S UP  +${lastAnswer.points} PTS`;
    } else if (lastAnswer.correct) {
      resultColor = 'var(--mako-correct)';
      resultText = `✓ CORRECT  +${lastAnswer.points} PTS`;
    } else {
      resultColor = 'var(--mako-wrong)';
      resultText = `✗ INCORRECT  +0 PTS`;
    }
  }

  return (
    <MakoPanel className="scanlines flex flex-col items-center gap-6 p-10 text-center">
      <div
        className="text-[10px] tracking-widest"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        SCORE
      </div>
      <div
        className="text-5xl font-bold tabular-nums"
        style={{ fontFamily: 'var(--font-ui)', color: 'var(--mako-teal)', textShadow: '0 0 16px var(--mako-teal)' }}
      >
        {formatScore(totalScore)}
      </div>

      {showResult && (
        <p
          className="text-sm tracking-widest font-semibold"
          style={{ fontFamily: 'var(--font-mono-mako)', color: resultColor }}
        >
          {resultText}
        </p>
      )}

      <p
        className="text-[11px] tracking-widest"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        QUESTION {completed} OF {total} COMPLETE
      </p>

      <MakoButton className="w-full max-w-xs py-4 uppercase text-sm" onClick={onContinue} autoFocus>
        Continue
      </MakoButton>
    </MakoPanel>
  );
}
