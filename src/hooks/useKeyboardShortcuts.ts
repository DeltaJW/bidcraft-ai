import { useEffect } from 'react'

/**
 * Listen for keyboard shortcuts.
 *
 * Keys use the format "ctrl+s", "ctrl+k", "ctrl+shift+n", etc.
 * "ctrl" maps to Cmd on Mac and Ctrl on Windows/Linux.
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const parts: string[] = []
      if (e.ctrlKey || e.metaKey) parts.push('ctrl')
      if (e.shiftKey) parts.push('shift')
      if (e.altKey) parts.push('alt')
      parts.push(e.key.toLowerCase())

      const combo = parts.join('+')

      if (shortcuts[combo]) {
        e.preventDefault()
        e.stopPropagation()
        shortcuts[combo]()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcuts])
}
