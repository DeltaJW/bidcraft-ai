import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: ReactNode
  variant?: 'default' | 'elevated' | 'inset' | 'brand'
}

const variantClass = {
  default: 'glass',
  elevated: 'card-elevated',
  inset: 'card-inset',
  brand: 'card-brand',
}

export default function GlassCard({ children, className = '', title, subtitle, action, variant = 'default' }: Props) {
  return (
    <div className={`${variantClass[variant]} p-5 ${className}`}>
      {title && (
        <div className="mb-4 pb-3 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h2>
            {action}
          </div>
          {subtitle && <p className="text-[11px] text-text-disabled mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
