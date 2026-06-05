import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
      .then(() => {
        if (!cancelled) setImageReady(true);
      })
      .catch(() => {
        if (!cancelled) setImageError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [question.id, question.imageUrl, timeLimit]);

  // Preload next image in parallel
  useEffect(() => {
    if (nextImageUrl) preloadImage(nextImageUrl).catch(() => undefined);
  }, [nextImageUrl]);

  const handleAnswer = (choiceIndex: number | null, opts: { timedOut?: boolean; skipped?: boolean } = {}) => {
    if (answeredRef.current) return;
    answeredRef.current = true;
    const remainingNow = opts.timedOut || opts.skipped ? 0 : remainingRef.current;
    const correct = choiceIndex !== null && choiceIndex === question.correctChoiceIndex;
    const points = correct ? computePoints(remainingNow, timeLimit) : 0;
    const responseTime = opts.timedOut || opts.skipped ? timeLimit : Math.max(0, timeLimit - remainingNow);
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

  // Keyboard 1-8
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Question {questionIndex + 1} of {total}
        </span>
      </div>

      <div className="relative w-full overflow-hidden rounded-lg border bg-muted">
        {!imageReady && !imageError && (
          <Skeleton className="aspect-video w-full" />
        )}
        {imageError && (
          <div className="flex aspect-video flex-col items-center justify-center gap-3 p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Image failed to load. You can skip this question with no penalty.
            </p>
            <Button variant="outline" onClick={() => handleAnswer(null, { skipped: true })}>
              Skip question (0 pts)
            </Button>
          </div>
        )}
        {!imageError && isVideoUrl(question.imageUrl) && (
          <video
            src={question.imageUrl}
            autoPlay
            loop
            muted
            playsInline
            controls={false}
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
      </div>

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

      <div
        className={cn(
          "grid gap-3",
          allImageChoices ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {question.choices.map((choice, idx) => (
          <button
            key={idx}
            type="button"
            disabled={!imageReady || imageError}
            onClick={() => handleAnswer(idx)}
            className={cn(
              "group relative flex min-h-16 items-center gap-3 rounded-lg border bg-card p-4 text-left transition-all",
              "hover:border-primary hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground">
              {idx + 1}
            </span>
            {choice.type === "image" ? (
              <img
                src={choice.value}
                alt={`Choice ${idx + 1}`}
                className="max-h-32 w-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.opacity = "0.3";
                }}
              />
            ) : (
              <span className="text-base font-medium">{choice.value}</span>
            )}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Tip: press 1–{question.choices.length} on your keyboard to answer.
      </p>
      <span className="sr-only">{remaining.toFixed(1)} seconds remaining</span>
    </div>
  );
}
