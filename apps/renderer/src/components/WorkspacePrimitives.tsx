/* eslint-disable react-refresh/only-export-components */
import type { User } from '@thiscord/shared'
import { X } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import type { PresenceRecord } from '../features/members/api'
import { errorMessage } from '../lib/pocketbase'

export function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'
}

export function formatTime(value: string) {
  const date = new Date(value)
  const today = new Date()
  const options: Intl.DateTimeFormatOptions = date.toDateString() === today.toDateString()
    ? { hour: '2-digit', minute: '2-digit' }
    : { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Intl.DateTimeFormat(undefined, options).format(date)
}

export function DataFailure({ error, onRetry, label = 'Could not load this content.' }: {
  readonly error: unknown
  readonly onRetry: () => void
  readonly label?: string
}) {
  return (
    <div className="data-failure" role="alert">
      <strong>{label}</strong>
      <span>{errorMessage(error)}</span>
      <button type="button" onClick={onRetry}>Try again</button>
    </div>
  )
}

export function resolvedPresence(userId: string, presence: PresenceRecord[]): User['status'] {
  const active = presence.filter((item) => (
    item.user === userId && new Date(item.expiresAt).getTime() > Date.now()
  ))
  if (active.some((item) => item.status === 'dnd')) return 'dnd'
  if (active.some((item) => item.status === 'online')) return 'online'
  if (active.some((item) => item.status === 'idle')) return 'idle'
  return 'offline'
}

export function ImageFileField({
  name,
  label,
  currentUrl = '',
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  banner = false,
}: {
  readonly name: string
  readonly label: string
  readonly currentUrl?: string
  readonly accept?: string
  readonly banner?: boolean
}) {
  const [preview, setPreview] = useState(currentUrl)
  const [removed, setRemoved] = useState(false)
  const objectUrl = useRef('')
  useEffect(() => () => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
  }, [])
  return (
    <div className={`image-file-field ${banner ? 'banner-file-field' : ''}`}>
      <span className="field-label">{label}</span>
      <div>
        <span className="image-file-preview">{preview && !removed ? <img src={preview} alt={`${label} preview`} /> : initials(label)}</span>
        <label className="file-select-button">
          Choose image
          <input name={name} type="file" accept={accept} onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
            objectUrl.current = URL.createObjectURL(file)
            setPreview(objectUrl.current)
            setRemoved(false)
          }} />
        </label>
        {(currentUrl || preview) && !removed ? <button className="secondary-action compact-action" type="button" onClick={() => { setRemoved(true); setPreview('') }}>Remove</button> : null}
      </div>
      <input type="hidden" name={`${name}Remove`} value={removed ? '1' : '0'} />
    </div>
  )
}

export function ModalFrame({ title, onClose, children }: {
  readonly title: string
  readonly onClose: () => void
  readonly children: ReactNode
}) {
  const dialogRef = useRef<HTMLElement>(null)
  useDialogAccessibility(dialogRef, onClose)
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section ref={dialogRef} className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button></header>
        {children}
      </section>
    </div>,
    document.body,
  )
}

export function useDialogAccessibility(
  dialogRef: RefObject<HTMLElement | null>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const root = document.getElementById('root')
    root?.setAttribute('inert', '')
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ) ?? [])
    focusable()[0]?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items.at(-1)!
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      root?.removeAttribute('inert')
      previousFocus?.focus()
    }
  }, [dialogRef])
}
