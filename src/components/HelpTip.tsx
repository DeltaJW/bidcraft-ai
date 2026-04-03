import { useState, useRef, useEffect, useCallback } from 'react'
import { HelpCircle } from 'lucide-react'

interface Props {
  text: string
  children?: React.ReactNode
}

export default function HelpTip({ text, children }: Props) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<'above' | 'below'>('above')
  const iconRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!iconRef.current) return
    const rect = iconRef.current.getBoundingClientRect()
    // If there's less than 120px above the icon, show below instead
    setPosition(rect.top < 120 ? 'below' : 'above')
  }, [])

  useEffect(() => {
    if (visible) updatePosition()
  }, [visible, updatePosition])

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setVisible((v) => !v)
  }

  // Close when clicking outside
  useEffect(() => {
    if (!visible) return
    function handleOutside(e: MouseEvent) {
      if (
        iconRef.current &&
        !iconRef.current.contains(e.target as Node) &&
        tipRef.current &&
        !tipRef.current.contains(e.target as Node)
      ) {
        setVisible(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [visible])

  return (
    <span className="help-tip-wrapper" ref={iconRef}>
      <span
        className="help-tip-icon"
        onClick={handleClick}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        role="button"
        tabIndex={0}
        aria-label="Help"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setVisible((v) => !v)
          }
        }}
      >
        {children ?? <HelpCircle size={14} />}
      </span>
      <div
        ref={tipRef}
        className={`help-tip-bubble ${position === 'below' ? 'help-tip-below' : 'help-tip-above'} ${visible ? 'help-tip-visible' : ''}`}
      >
        <div className="help-tip-arrow" />
        <span>{text}</span>
      </div>
    </span>
  )
}
