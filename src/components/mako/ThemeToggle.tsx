import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/theme-context'
import { cn } from '@/lib/utils'

const OPTIONS: { value: Theme; Icon: typeof Sun; label: string }[] = [
  { value: 'light', Icon: Sun, label: 'Light' },
  { value: 'dark', Icon: Moon, label: 'Dark' },
  { value: 'system', Icon: Monitor, label: 'System' },
]

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  return (
    <div
      className={cn('flex items-center gap-px clip-mako p-[2px]', className)}
      style={{ background: 'var(--mako-panel)', boxShadow: 'inset 0 0 0 1px var(--mako-line)' }}
    >
      {OPTIONS.map(({ value, Icon, label }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} theme`}
          title={label}
          onClick={() => setTheme(value)}
          className="flex h-[26px] w-[26px] items-center justify-center transition-colors"
          style={{
            color: theme === value ? 'var(--mako-teal)' : 'var(--mako-sub)',
          }}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}
