import { MakoButton } from "@/components/mako";

interface Props {
  correct: boolean;
  points: number;
  responseTime?: number;
  onContinue: () => void;
}

export function FeedbackInterstitial({ correct, points, responseTime, onContinue }: Props) {
  const accentColor = correct ? 'var(--mako-correct)' : 'var(--mako-wrong)';

  return (
    <div
      className="scanlines flex flex-col items-center gap-6 clip-mako p-8 text-center"
      style={{ background: 'var(--mako-panel)', boxShadow: `inset 0 0 0 1px var(--mako-line), 0 0 40px ${accentColor}22` }}
    >
      <h2
        className="text-5xl font-bold tracking-widest"
        style={{
          fontFamily: 'var(--font-ui)',
          color: accentColor,
          textShadow: `0 0 24px ${accentColor}`,
        }}
      >
        {correct ? 'CORRECT' : 'WRONG'}
      </h2>

      <div
        className="text-3xl font-bold"
        style={{
          fontFamily: 'var(--font-mono-mako)',
          color: 'var(--mako-amber)',
          textShadow: '0 0 12px var(--mako-amber)',
        }}
      >
        {correct ? `+${points}` : '+0'} PTS
      </div>

      {responseTime != null && (
        <div
          className="text-[11px] tracking-widest"
          style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
        >
          {responseTime.toFixed(2)}s RESPONSE TIME
        </div>
      )}

      <MakoButton onClick={onContinue} autoFocus className="w-full max-w-xs uppercase text-sm">
        Next Round
      </MakoButton>
    </div>
  );
}
