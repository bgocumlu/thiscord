import type { KeyboardEvent } from 'react'
import type { ContextMenuPoint } from './ContextMenu'

export function keyboardContextMenuPoint(
  event: KeyboardEvent<HTMLElement>,
): ContextMenuPoint | null {
  if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return null
  event.preventDefault()
  const bounds = event.currentTarget.getBoundingClientRect()
  return {
    x: Math.min(bounds.left + 18, window.innerWidth - 12),
    y: Math.min(bounds.top + 18, window.innerHeight - 12),
  }
}
