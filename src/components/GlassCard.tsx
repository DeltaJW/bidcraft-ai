import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export default function GlassCard({ children, className = '', title, subtitle }: Props) {
  return (
    <div className={`glass p-6 ${className}`}>
      {title && (
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-navy-400 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}
