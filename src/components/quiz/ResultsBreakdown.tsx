import { CheckCircle2, Clock, XCircle, SkipForward } from "lucide-react";
import type { AnswerRecord, Quiz } from "@/lib/types";

interface Props {
  quiz: Quiz;
  answers: AnswerRecord[];
}

export function ResultsBreakdown({ quiz, answers }: Props) {
  const totalScore = answers.reduce((s, a) => s + a.points, 0);
  const totalTime = answers.reduce((s, a) => s + a.responseTime, 0);
  const correctCount = answers.filter((a) => a.correct).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Score" value={totalScore.toString()} />
        <Stat label="Correct" value={`${correctCount} / ${quiz.questions.length}`} />
        <Stat label="Total time" value={`${totalTime.toFixed(1)}s`} />
      </div>
      <div className="rounded-lg border">
        <div className="border-b px-4 py-2 text-sm font-semibold">Breakdown</div>
        <ul className="divide-y">
          {answers.map((a, i) => (
            <li key={a.questionId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                {a.skipped ? (
                  <SkipForward className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : a.timedOut ? (
                  <Clock className="h-4 w-4 shrink-0 text-amber-500" />
                ) : a.correct ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                )}
                <span className="truncate">Question {i + 1}</span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{a.responseTime.toFixed(1)}s</span>
                <span className="font-semibold text-foreground">{a.points} pts</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
