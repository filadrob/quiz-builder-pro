import { cn } from '@/lib/utils'
import { MakoPanel } from './MakoPanel'

interface MakoBarProps {
  channel: string
  guild: string
  online?: number
  className?: string
}

export function MakoBar({ channel, guild, online, className }: MakoBarProps) {
  return (
    <MakoPanel
      className={cn('flex shrink-0 items-center gap-[11px] px-[14px] py-[9px]', className)}
    >
      <div
        className="size-[26px] shrink-0 glow-teal"
        style={{
          clipPath: 'polygon(50% 0,100% 50%,50% 100%,0 50%)',
          background: 'var(--mako-teal)',
        }}
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <div
          className="truncate text-[14px] leading-none tracking-[0.5px]"
          style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-teal)' }}
        >
          #{channel}
        </div>
        <div
          className="mt-[2px] text-[11.5px] tracking-[0.5px]"
          style={{ color: 'var(--mako-sub)' }}
        >
          {guild}
        </div>
      </div>
      {online != null && (
        <div
          className="ml-auto flex items-center text-[13px]"
          style={{ fontFamily: 'var(--font-mono-mako)', color: 'var(--mako-sub)' }}
        >
          <span style={{ color: 'var(--mako-teal)' }}>▲</span>
          {online}
        </div>
      )}
    </MakoPanel>
  )
}
