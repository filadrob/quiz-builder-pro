import { Slot } from '@radix-ui/react-slot'
import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type MakoButtonVariant = 'primary' | 'secondary'

interface MakoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: MakoButtonVariant
  asChild?: boolean
}

export function MakoButton({
  variant = 'primary',
  asChild = false,
  className,
  children,
  ...props
}: MakoButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      {...(props as ButtonHTMLAttributes<HTMLButtonElement>)}
      className={cn(
        'clip-mako cursor-pointer px-4 py-[13px] text-center font-[600] tracking-widest transition-[box-shadow] duration-[140ms]',
        className,
      )}
      style={{
        fontFamily: 'var(--font-ui)',
        ...(variant === 'primary'
          ? {
              background: `linear-gradient(160deg, var(--mako-teal), var(--mako-correct))`,
              color: '#04120d',
            }
          : {
              background: 'var(--mako-panel)',
              color: 'var(--mako-ink)',
              boxShadow: 'inset 0 0 0 1px var(--mako-line)',
            }),
      }}
    >
      {children}
    </Comp>
  )
}
