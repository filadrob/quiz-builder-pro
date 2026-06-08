import { cn } from '@/lib/utils'

const CELLS = 14

interface MakoChargeProps {
  value: number
  max: number
  className?: string
}

export function MakoCharge({ value, max, className }: MakoChargeProps) {
  const frac = Math.max(0, value / max)
  const low = value <= 4
  const color = low ? 'var(--mako-amber)' : 'var(--mako-teal)'
  const lit = frac * CELLS

  return (
    <div className={cn('flex items-center gap-[10px]', className)}>
      <span
        className="shrink-0 text-[12px] tracking-[1px]"
        style={{ fontFamily: 'var(--font-mono-mako)', color }}
      >
        CHARGE
      </span>
      <div
        className="clip-mako flex h-[14px] flex-1 gap-[2px] p-[2px]"
        style={{ boxShadow: `inset 0 0 0 1px var(--mako-line)` }}
      >
        {Array.from({ length: CELLS }, (_, i) => (
          <div
            key={i}
            className="relative flex-1 overflow-hidden"
            style={{ background: 'var(--mako-line-soft)' }}
          >
            <span
              className="absolute inset-0 block"
              style={{
                background: i < lit ? color : 'transparent',
                boxShadow: i < lit && i >= lit - 1 ? `0 0 8px ${color}` : 'none',
                opacity: i < lit ? 1 : 0.12,
              }}
            />
          </div>
        ))}
      </div>
      <span
        className="w-[34px] text-right text-[17px]"
        style={{
          fontFamily: 'var(--font-mono-mako)',
          color,
          textShadow: `0 0 10px ${color}`,
        }}
      >
        {Math.ceil(value).toString().padStart(2, '0')}
      </span>
    </div>
  )
}
