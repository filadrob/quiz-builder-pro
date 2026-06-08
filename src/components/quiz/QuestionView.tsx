import { useEffect, useRef, useState } from "react";
import { MakoPanel } from "@/components/mako";
import { Timer } from "./Timer";
import { preloadImage, isVideoUrl } from "@/lib/image";
import { computePoints } from "@/lib/scoring";
import type { AnswerRecord, Question } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface Props {
  question: Question;
  questionIndex: number;
  total: number;
  timeLimit: number;
  nextImageUrl: string | null;
  onAnswered: (record: AnswerRecord) => void;
}

const KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

export function QuestionView({
  question,
  questionIndex,
  total,
  timeLimit,
  nextImageUrl,
  onAnswered,
}: Props) {
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [remaining, setRemaining] = useState(timeLimit);
  const remainingRef = useRef(timeLimit);
  const answeredRef = useRef(false);

  useEffect(() => {
    answeredRef.current = false;
    setImageReady(false);
    setImageError(false);
    setRemaining(timeLimit);
    remainingRef.current = timeLimit;
    let cancelled = false;
    preloadImage(question.imageUrl)
      .then(() => { if (!cancelled) setImageReady(true); })
      .catch(() => { if (!cancelled) setImageError(true); });
    return () => { cancelled = true; };
  }, [question.id, question.imageUrl, timeLimit]);

  useEffect(() => {
    if (nextImageUrl) preloadImage(nextImageUrl).catch(() => undefined);
  }, [nextImageUrl]);

  const handleAnswer = (
    choiceIndex: number | null,
    opts: { timedOut?: boolean; skipped?: boolean } = {},
  ) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    const remainingNow = opts.timedOut || opts.skipped ? 0 : remainingRef.current;
    const correct = choiceIndex !== null && choiceIndex === question.correctChoiceIndex;
    const points = correct ? computePoints(remainingNow, timeLimit) : 0;
    const responseTime = opts.timedOut || opts.skipped
      ? timeLimit
      : Math.max(0, timeLimit - remainingNow);
    onAnswered({
      questionId: question.id,
      selectedChoiceIndex: choiceIndex,
      correct,
      timeRemaining: remainingNow,
      responseTime,
      points,
      skipped: !!opts.skipped,
      timedOut: !!opts.timedOut,
    });
  };

  // Keyboard 1–8
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!imageReady || imageError) return;
      const n = parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= question.choices.length) {
        handleAnswer(n - 1);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageReady, imageError, question.id]);

  const allImageChoices = question.choices.every((c) => c.type === "image");

  return (
    <div className="flex flex-col gap-4">
      {/* Counter */}
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] tracking-widest"
          style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
        >
          QUESTION
        </span>
        <span
          className="text-[11px] tracking-widest"
          style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-teal)', textShadow: '0 0 8px var(--mako-teal)' }}
        >
          {String(questionIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </span>
      </div>

      {/* Image */}
      <MakoPanel className="scanlines relative w-full overflow-hidden">
        {!imageReady && !imageError && (
          <div
            className="aspect-video w-full animate-pulse"
            style={{ background: 'var(--mako-line-soft)' }}
          />
        )}
        {imageError && (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="h-10 w-10" style={{ color: 'var(--mako-wrong)' }} />
            <p className="text-sm" style={{ color: 'var(--mako-sub)' }}>
              Image failed to load. Skip with no penalty.
            </p>
            <button
              type="button"
              className="clip-mako px-4 py-2 text-sm tracking-widest uppercase"
              style={{
                fontFamily: 'var(--font-ui)',
                background: 'var(--mako-panel)',
                boxShadow: 'inset 0 0 0 1px var(--mako-line)',
                color: 'var(--mako-ink)',
              }}
              onClick={() => handleAnswer(null, { skipped: true })}
            >
              Skip (0 pts)
            </button>
          </div>
        )}
        {!imageError && isVideoUrl(question.imageUrl) && (
          <video
            src={question.imageUrl}
            autoPlay loop muted playsInline controls={false}
            className={cn(
              "block h-auto max-h-[60vh] w-full object-contain transition-opacity",
              imageReady ? "opacity-100" : "opacity-0 absolute inset-0",
            )}
          />
        )}
        {!imageError && !isVideoUrl(question.imageUrl) && (
          <img
            src={question.imageUrl}
            alt="Question"
            className={cn(
              "block h-auto max-h-[60vh] w-full object-contain transition-opacity",
              imageReady ? "opacity-100" : "opacity-0 absolute inset-0",
            )}
          />
        )}
      </MakoPanel>

      {!imageError && (
        <Timer
          timeLimit={timeLimit}
          running={imageReady}
          resetKey={question.id}
          onTick={(r) => {
            remainingRef.current = r;
            setRemaining(r);
          }}
          onExpire={() => handleAnswer(null, { timedOut: true })}
        />
      )}

      {/* Choices */}
      <div
        className={cn(
          "grid gap-3",
          allImageChoices ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {question.choices.map((choice, idx) => (
          <ChoiceButton
            key={idx}
            label={KEYS[idx] ?? String(idx + 1)}
            disabled={!imageReady || imageError}
            onClick={() => handleAnswer(idx)}
          >
            {choice.type === "image" ? (
              <img
                src={choice.value}
                alt={`Choice ${idx + 1}`}
                className="max-h-32 w-full object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.3"; }}
              />
            ) : (
              <span className="text-sm font-medium" style={{ color: 'var(--mako-ink)' }}>
                {choice.value}
              </span>
            )}
          </ChoiceButton>
        ))}
      </div>

      <p
        className="text-[10px] tracking-widest"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        PRESS 1–{question.choices.length} TO ANSWER
      </p>
      <span className="sr-only">{remaining.toFixed(1)} seconds remaining</span>
    </div>
  );
}

function ChoiceButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group relative flex min-h-14 items-center gap-3 clip-mako p-4 text-left transition-[box-shadow] duration-[120ms] disabled:cursor-not-allowed disabled:opacity-40"
      style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
      onMouseEnter={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.boxShadow =
          '0 0 16px var(--mako-glow), inset 0 0 0 1px var(--mako-teal)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'inset 0 0 0 1px var(--mako-line)';
      }}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center text-xs font-bold clip-mako"
        style={{
          background: 'var(--mako-line-soft)',
          boxShadow: 'inset 0 0 0 1px var(--mako-line)',
          fontFamily: 'var(--font-mono-mako)',
          color: 'var(--mako-teal)',
        }}
      >
        {label}
      </span>
      {children}
    </button>
  );
}
