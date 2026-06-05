import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  timeLimit: number;
  running: boolean;
  onExpire: () => void;
  onTick?: (remaining: number) => void;
  resetKey: string | number;
}

export function Timer({ timeLimit, running, onExpire, onTick, resetKey }: TimerProps) {
  const [remaining, setRemaining] = useState(timeLimit);

  useEffect(() => {
    setRemaining(timeLimit);
  }, [resetKey, timeLimit]);

  useEffect(() => {
    if (!running) return;
    const start = performance.now();
    const initial = remaining;
    let raf = 0;
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      const next = Math.max(0, initial - elapsed);
      setRemaining(next);
      onTick?.(next);
      if (next <= 0) {
        onExpire();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, resetKey]);

  const ratio = timeLimit > 0 ? remaining / timeLimit : 0;
  const color =
    ratio < 0.25
      ? "bg-red-500 text-white"
      : ratio < 0.5
        ? "bg-amber-500 text-white"
        : "bg-emerald-500 text-white";

  const barColor =
    ratio < 0.25 ? "bg-red-500" : ratio < 0.5 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Time left</span>
        <span
          className={cn(
            "rounded-md px-2 py-1 text-sm font-semibold tabular-nums transition-colors",
            color,
          )}
        >
          {remaining.toFixed(1)}s
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-[width,background-color] duration-100", barColor)}
          style={{ width: `${Math.max(0, Math.min(100, ratio * 100))}%` }}
        />
      </div>
    </div>
  );
}
