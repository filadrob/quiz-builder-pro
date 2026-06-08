import { useEffect, useState } from "react";
import { MakoCharge } from "@/components/mako";

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

  return (
    <div aria-live="polite">
      <MakoCharge value={remaining} max={timeLimit} />
      <span className="sr-only">{remaining.toFixed(1)} seconds remaining</span>
    </div>
  );
}
