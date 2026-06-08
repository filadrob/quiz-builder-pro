import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MakoPanelProps {
  children: ReactNode
  className?: string
}

export function MakoPanel({ children, className }: MakoPanelProps) {
  return (
    <div
      className={cn(
        'relative clip-mako',
        className
      )}
      style={{
        background: 'var(--mako-panel)',
        boxShadow: 'inset 0 0 0 1px var(--mako-line), 0 6px 22px rgba(0,0,0,.4)',
      }}
    >
      {children}
    </div>
  )
}
