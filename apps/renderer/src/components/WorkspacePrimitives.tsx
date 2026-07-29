import { TriangleAlert, X } from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useDialogAccessibility } from '../hooks/useDialogAccessibility'
import { createDisposableObjectUrl } from '../lib/objectUrl'
import { errorMessage } from '../lib/pocketbase'
import { initials } from './workspaceUtils'

const loadingStatusProps = {
  role: 'status',
  'aria-live': 'polite',
  'aria-atomic': true,
} as const

export function LoadingState({
  children,
  fullscreen = false,
}: {
  readonly children: ReactNode
  readonly fullscreen?: boolean
}) {
  return fullscreen ? (
    <main className="loading-state fullscreen">
      <span {...loadingStatusProps}>{children}</span>
    </main>
  ) : (
    <div className="loading-state" {...loadingStatusProps}>{children}</div>
  )
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
  const objectUrl = useRef<ReturnType<typeof createDisposableObjectUrl> | null>(null)
  useEffect(() => () => {
    objectUrl.current?.revoke()
  }, [])
  return (
    <div className={`image-file-field ${banner ? 'banner-file-field' : ''}`}>
      <span className="field-label">{label}</span>
      <div>
        <span className="image-file-preview">{preview && !removed ? (
          <img
            src={preview}
            alt={`${label} preview`}
            width={banner ? 120 : 56}
            height={56}
            decoding="async"
          />
        ) : initials(label)}</span>
        <label className="file-select-button">
          Choose image
          <input name={name} type="file" accept={accept} onChange={(event) => {
            const file = event.target.files?.[0]
            if (!file) return
            objectUrl.current?.revoke()
            objectUrl.current = createDisposableObjectUrl(file)
            setPreview(objectUrl.current.url)
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  useDialogAccessibility(dialogRef, onClose)
  return createPortal(
    <dialog ref={dialogRef} className="modal-backdrop" aria-label={title}>
      <section className="modal-card">
        <header><h2>{title}</h2><button type="button" onClick={onClose} aria-label={`Close ${title}`}><X size={18} /></button></header>
        {children}
      </section>
    </dialog>,
    document.body,
  )
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  busy = false,
}: {
  readonly title: string
  readonly description: ReactNode
  readonly confirmLabel: string
  readonly onConfirm: () => void | Promise<void>
  readonly onClose: () => void
  readonly busy?: boolean
}) {
  return (
    <ModalFrame title={title} onClose={busy ? () => undefined : onClose}>
      <div className="confirmation-copy">
        <span className="confirmation-icon" aria-hidden="true">
          <TriangleAlert size={20} />
        </span>
        <p>{description}</p>
      </div>
      <div className="confirmation-actions">
        <button className="secondary-action" type="button" disabled={busy} onClick={onClose}>
          Cancel
        </button>
        <button
          className="danger-action"
          type="button"
          disabled={busy}
          onClick={() => void onConfirm()}
        >
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </ModalFrame>
  )
}
