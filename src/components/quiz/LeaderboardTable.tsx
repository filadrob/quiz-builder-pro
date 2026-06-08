import type { LeaderboardEntry } from "@/lib/types";
import { formatScore, formatTime } from "@/lib/format";

export function LeaderboardTable({
  entries,
  highlight,
}: {
  entries: LeaderboardEntry[];
  highlight?: { name: string; score: number } | null;
}) {
  if (!entries.length) {
    return (
      <div
        className="clip-mako p-6 text-center text-[11px] tracking-widest"
        style={{
          background: 'var(--mako-panel)',
          boxShadow: 'inset 0 0 0 1px var(--mako-line)',
          fontFamily: 'var(--font-mono-mako)',
          color: 'var(--mako-sub)',
        }}
      >
        NO SCORES YET — BE THE FIRST
      </div>
    );
  }

  let highlightedOnce = false;

  return (
    <div
      className="clip-mako overflow-hidden"
      style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
    >
      <div
        className="grid grid-cols-[2.5rem_1fr_auto_auto] gap-3 px-4 py-2 text-[10px] tracking-widest"
        style={{
          fontFamily: 'var(--font-mono-mako)',
          color: 'var(--mako-sub)',
          background: 'var(--mako-line-soft)',
          borderBottom: '1px solid var(--mako-line)',
        }}
      >
        <span>RANK</span>
        <span>NAME</span>
        <span className="text-right">SCORE</span>
        <span className="hidden text-right sm:block">TIME</span>
      </div>

      {entries.map((e, i) => {
        const displayName = e.isAnonymous ? 'Anonymous' : e.name || 'Anonymous';
        const isHighlight =
          !highlightedOnce &&
          !!highlight &&
          displayName === (highlight.name || 'Anonymous') &&
          e.score === highlight.score;
        if (isHighlight) highlightedOnce = true;

        const rankColor =
          i === 0 ? 'var(--mako-amber)' :
          i === 1 ? 'var(--mako-teal)' :
          i === 2 ? 'var(--mako-magenta)' :
          'var(--mako-sub)';

        return (
          <div
            key={`${e.name}-${e.timestamp}-${i}`}
            className="grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-3 px-4 py-3 text-sm"
            style={{
              borderBottom: '1px solid var(--mako-line)',
              background: isHighlight ? 'rgba(70,224,176,.06)' : 'transparent',
              ...(isHighlight ? { boxShadow: 'inset 3px 0 0 var(--mako-teal)' } : {}),
            }}
          >
            <span
              className="font-bold text-[13px]"
              style={{ fontFamily: 'var(--font-mono-mako)', color: rankColor }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-[9px] font-bold"
                style={{
                  clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
                  background: rankColor,
                  color: '#04120d',
                }}
              >
                {displayName[0]?.toUpperCase() ?? '?'}
              </span>
              <span
                className="truncate text-sm"
                style={{ color: isHighlight ? 'var(--mako-teal)' : 'var(--mako-ink)' }}
              >
                {displayName}
              </span>
              {isHighlight && (
                <span
                  className="shrink-0 text-[9px] tracking-widest"
                  style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-teal)' }}
                >
                  YOU
                </span>
              )}
            </div>
            <span
              className="text-right font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-amber)' }}
            >
              {formatScore(e.score)}
            </span>
            <span
              className="hidden text-right tabular-nums text-xs sm:block"
              style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
            >
              {formatTime(e.totalTime)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
