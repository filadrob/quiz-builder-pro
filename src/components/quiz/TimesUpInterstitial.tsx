export function TimesUpInterstitial() {
  return (
    <div
      className="scanlines flex flex-col items-center gap-4 clip-mako p-8 text-center"
      style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line), 0 0 40px rgba(255,180,84,.1)' }}
    >
      <div
        className="text-5xl font-bold tracking-widest"
        style={{
          fontFamily: 'var(--font-ui)',
          color: 'var(--mako-amber)',
          textShadow: '0 0 24px var(--mako-amber)',
        }}
      >
        TIME'S UP
      </div>
      <p
        className="text-[11px] tracking-widest"
        style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
      >
        NEXT QUESTION...
      </p>
    </div>
  );
}
