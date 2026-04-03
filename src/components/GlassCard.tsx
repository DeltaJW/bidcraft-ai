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
    <div className={`${variantClass[variant]} p-6 ${className}`}>
      {title && (
        <div className="mb-5 pb-3 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            {action}
          </div>
          {subtitle && <p className="text-sm text-text-tertiary mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
