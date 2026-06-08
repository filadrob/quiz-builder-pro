import { CheckCircle2, Clock, XCircle, SkipForward } from "lucide-react";
import type { AnswerRecord, Quiz } from "@/lib/types";

export function ResultsBreakdown({ quiz, answers }: { quiz: Quiz; answers: AnswerRecord[] }) {
  const totalScore = answers.reduce((s, a) => s + a.points, 0);
  const totalTime = answers.reduce((s, a) => s + a.responseTime, 0);
  const correctCount = answers.filter((a) => a.correct).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="SCORE" value={totalScore.toString()} color="var(--mako-teal)" />
        <Stat label="CORRECT" value={`${correctCount}/${quiz.questions.length}`} color="var(--mako-amber)" />
        <Stat label="TIME" value={`${totalTime.toFixed(1)}s`} color="var(--mako-sub)" />
      </div>

      <div
        className="clip-mako overflow-hidden"
        style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
      >
        <div
          className="px-4 py-2 text-[10px] tracking-widest"
          style={{
            fontFamily: 'var(--font-mono-mako)',
            color: 'var(--mako-sub)',
            background: 'var(--mako-line-soft)',
            borderBottom: '1px solid var(--mako-line)',
          }}
        >
          BREAKDOWN
        </div>
        <ul>
          {answers.map((a, i) => (
            <li
              key={a.questionId}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              style={{ borderBottom: '1px solid var(--mako-line)' }}
            >
              <div className="flex min-w-0 items-center gap-3">
                {a.skipped ? (
                  <SkipForward className="h-4 w-4 shrink-0" style={{ color: 'var(--mako-sub)' }} />
                ) : a.timedOut ? (
                  <Clock className="h-4 w-4 shrink-0" style={{ color: 'var(--mako-amber)' }} />
                ) : a.correct ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--mako-correct)' }} />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" style={{ color: 'var(--mako-wrong)' }} />
                )}
                <span style={{ color: 'var(--mako-ink)' }}>Question {i + 1}</span>
              </div>
              <div className="flex items-center gap-4" style={{ fontFamily: 'var(--font-mono-mako)' }}>
                <span className="text-xs" style={{ color: 'var(--mako-sub)' }}>
                  {a.responseTime.toFixed(1)}s
                </span>
                <span
                  className="font-bold"
                  style={{ color: a.correct ? 'var(--mako-teal)' : 'var(--mako-sub)' }}
                >
                  {a.points} pts
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="clip-mako p-4 text-center"
      style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
    >
      <div
        className="text-[10px] uppercase tracking-widest"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        {label}
      </div>
      <div
        className="mt-1 text-2xl font-bold"
        style={{ fontFamily: 'var(--font-ui)', color }}
      >
        {value}
      </div>
    </div>
  );
}
