import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

export interface ContextMenuPoint {
  readonly x: number
  readonly y: number
}

const CloseMenuContext = createContext<() => void>(() => undefined)

function menuItems(menu: HTMLElement) {
  return [...menu.querySelectorAll<HTMLElement>(
    '[role="menuitem"]:not([disabled]), [role="menuitemcheckbox"]:not([disabled])',
  )]
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
  const [position, setPosition] = useState(point)

  useLayoutEffect(() => {
    const menu = menuRef.current
    if (!menu) return
    const padding = 8
    const bounds = menu.getBoundingClientRect()
    setPosition({
      x: Math.max(padding, Math.min(point.x, window.innerWidth - bounds.width - padding)),
      y: Math.max(padding, Math.min(point.y, window.innerHeight - bounds.height - padding)),
    })
    menuItems(menu)[0]?.focus()
  }, [point])

  useEffect(() => {
    const closeOnPointer = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) onClose()
    }
    const closeOnViewportChange = () => onClose()
    window.addEventListener('pointerdown', closeOnPointer)
    window.addEventListener('resize', closeOnViewportChange)
    window.addEventListener('scroll', closeOnViewportChange, true)
    return () => {
      window.removeEventListener('pointerdown', closeOnPointer)
      window.removeEventListener('resize', closeOnViewportChange)
      window.removeEventListener('scroll', closeOnViewportChange, true)
    }
  }, [onClose])

  const navigate = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' || event.key === 'Tab') {
      event.preventDefault()
      onClose()
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const items = menuItems(event.currentTarget)
    if (!items.length) return
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : event.key === 'ArrowDown'
          ? (currentIndex + 1 + items.length) % items.length
          : (currentIndex - 1 + items.length) % items.length
    items[nextIndex]?.focus()
  }

  return createPortal(
    <CloseMenuContext.Provider value={onClose}>
      <div
        ref={menuRef}
        className="context-menu"
        role="menu"
        aria-label={label}
        style={{ left: position.x, top: position.y }}
        onKeyDown={navigate}
      >
        {children}
      </div>
    </CloseMenuContext.Provider>,
    document.body,
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
      role={checked === undefined ? 'menuitem' : 'menuitemcheckbox'}
      aria-checked={checked}
      disabled={disabled}
      tabIndex={-1}
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
  return <div className="context-menu-separator" role="separator" />
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
    <label className="context-menu-slider">
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
    </label>
  )
}
