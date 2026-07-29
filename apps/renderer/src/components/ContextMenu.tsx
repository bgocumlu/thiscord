import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { contextDialogTabTarget } from './contextMenuKeyboard'

export interface ContextMenuPoint {
  readonly x: number
  readonly y: number
}

const CloseMenuContext = createContext<() => void>(() => undefined)

function dialogControls(menu: HTMLElement) {
  return [...menu.querySelectorAll<HTMLElement>(
    'button:not([disabled]), input:not([disabled])',
  )]
}

function contextMenuHost(point: ContextMenuPoint, returnFocus: HTMLElement | null) {
  const focusedDialog = returnFocus?.closest<HTMLDialogElement>('dialog[open]')
  if (focusedDialog) return focusedDialog

  const pointDialog = document
    .elementFromPoint(point.x, point.y)
    ?.closest<HTMLDialogElement>('dialog[open]')
  return pointDialog ?? document.body
}

export function ContextMenu({
  point,
  label,
  onClose,
  children,
}: {
  readonly point: ContextMenuPoint
  readonly label: string
  readonly onClose: () => void
  readonly children: ReactNode
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [returnFocus] = useState<HTMLElement | null>(() => (
    document.activeElement instanceof HTMLElement ? document.activeElement : null
  ))
  const [portalRoot] = useState(() => contextMenuHost(point, returnFocus))
  const constrainedToDialog = portalRoot instanceof HTMLDialogElement
  const [position, setPosition] = useState(() => {
    if (!constrainedToDialog) return point
    const bounds = portalRoot.getBoundingClientRect()
    return {
      x: point.x - bounds.left,
      y: point.y - bounds.top,
    }
  })

  const closeAndRestoreFocus = useCallback(() => {
    onClose()
    window.requestAnimationFrame(() => {
      const activeElement = document.activeElement
      if (
        !activeElement
        || activeElement === document.body
        || !activeElement.isConnected
      ) {
        returnFocus?.focus()
      }
    })
  }, [onClose, returnFocus])

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const padding = 8
    const bounds = menu.getBoundingClientRect()
    const hostBounds = constrainedToDialog
      ? portalRoot.getBoundingClientRect()
      : {
          left: 0,
          top: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }
    const pointInHost = {
      x: point.x - hostBounds.left,
      y: point.y - hostBounds.top,
    }
    setPosition({
      x: Math.max(
        padding,
        Math.min(pointInHost.x, hostBounds.width - bounds.width - padding),
      ),
      y: Math.max(
        padding,
        Math.min(pointInHost.y, hostBounds.height - bounds.height - padding),
      ),
    })
    dialogControls(menu)[0]?.focus()
  }, [constrainedToDialog, point, portalRoot])

  useEffect(() => {
    const closeOnPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) closeAndRestoreFocus()
    }
    const closeOnResize = () => closeAndRestoreFocus()
    const closeOnScroll = (event: Event) => {
      const target = event.target
      if (
        target instanceof Node
        && (
          menuRef.current?.contains(target)
          || (constrainedToDialog && portalRoot.contains(target))
        )
      ) return
      closeAndRestoreFocus()
    }
    window.addEventListener('pointerdown', closeOnPointer)
    window.addEventListener('resize', closeOnResize)
    window.addEventListener('scroll', closeOnScroll, true)
    return () => {
      window.removeEventListener('pointerdown', closeOnPointer)
      window.removeEventListener('resize', closeOnResize)
      window.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [closeAndRestoreFocus, constrainedToDialog, portalRoot])

  const navigate = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeAndRestoreFocus()
      return
    }
    const controls = dialogControls(event.currentTarget)
    if (event.key === 'Tab') {
      event.preventDefault()
      if (!controls.length) {
        closeAndRestoreFocus()
        return
      }
      const currentIndex = controls.indexOf(document.activeElement as HTMLElement)
      const nextIndex = contextDialogTabTarget(currentIndex, controls.length, event.shiftKey)
      if (nextIndex === null) {
        closeAndRestoreFocus()
      } else {
        controls[nextIndex]?.focus()
      }
      return
    }
    if (event.target instanceof HTMLInputElement && event.target.type === 'range') return
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    if (!controls.length) return
    const currentIndex = controls.indexOf(document.activeElement as HTMLElement)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? controls.length - 1
        : event.key === 'ArrowDown'
          ? (currentIndex + 1 + controls.length) % controls.length
          : (currentIndex - 1 + controls.length) % controls.length
    controls[nextIndex]?.focus()
  }

  return createPortal(
    <CloseMenuContext.Provider value={closeAndRestoreFocus}>
      <div
        ref={menuRef}
        className="context-menu"
        role="dialog"
        aria-label={label}
        style={{
          left: position.x,
          top: position.y,
          position: constrainedToDialog ? 'absolute' : undefined,
          maxWidth: constrainedToDialog ? 'calc(100% - 16px)' : undefined,
          maxHeight: constrainedToDialog ? 'calc(100% - 16px)' : undefined,
        }}
        onKeyDown={navigate}
      >
        {children}
      </div>
    </CloseMenuContext.Provider>,
    portalRoot,
  )
}

export function ContextMenuItem({
  icon,
  children,
  onSelect,
  checked,
  danger = false,
  disabled = false,
}: {
  readonly icon?: ReactNode
  readonly children: ReactNode
  readonly onSelect: () => void | Promise<void>
  readonly checked?: boolean
  readonly danger?: boolean
  readonly disabled?: boolean
}) {
  const close = useContext(CloseMenuContext)
  return (
    <button
      className={danger ? 'danger' : ''}
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => {
        close()
        void onSelect()
      }}
    >
      <span className="context-menu-icon">{icon}</span>
      <span>{children}</span>
      {checked !== undefined ? <span className="context-menu-check">{checked ? '✓' : ''}</span> : null}
    </button>
  )
}

export function ContextMenuSeparator() {
  return <hr className="context-menu-separator" />
}

export function ContextMenuSlider({
  label,
  value,
  onChange,
}: {
  readonly label: string
  readonly value: number
  readonly onChange: (value: number) => void
}) {
  return (
    <div className="context-menu-slider">
      <span><span>{label}</span><output>{value}%</output></span>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </div>
  )
}
