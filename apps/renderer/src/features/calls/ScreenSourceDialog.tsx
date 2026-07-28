import type { DesktopCaptureSource } from '@thiscord/shared'
import { useRef, useState } from 'react'
import { useDialogAccessibility } from '../../hooks/useDialogAccessibility'

export function ScreenSourceDialog({
  sources,
  error,
  onClose,
  onSelect,
}: {
  readonly sources: readonly DesktopCaptureSource[]
  readonly error: string
  readonly onClose: () => void
  readonly onSelect: (sourceId: string, shareSystemAudio: boolean) => void
}) {
  const [shareSystemAudio, setShareSystemAudio] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  useDialogAccessibility(dialogRef, onClose)
  if (!sources.length) return null

  return (
    <dialog ref={dialogRef} className="modal-backdrop screen-picker-backdrop" aria-labelledby="screen-source-title">
      <section className="screen-source-picker">
        <header>
          <span><h2 id="screen-source-title">Share your screen</h2><p>Choose a display or window.</p></span>
          <button type="button" onClick={onClose}>Cancel</button>
        </header>
        <label>
          <input
            type="checkbox"
            checked={shareSystemAudio}
            onChange={(event) => setShareSystemAudio(event.target.checked)}
          />
          Share system audio
        </label>
        <div className="screen-source-grid">
          {sources.map((source) => (
            <button
              type="button"
              onClick={() => onSelect(source.id, shareSystemAudio)}
              key={source.id}
            >
              <img src={source.thumbnailUrl} alt="" />
              <span>{source.appIconUrl ? <img src={source.appIconUrl} alt="" /> : null}<strong>{source.name}</strong></span>
            </button>
          ))}
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </section>
    </dialog>
  )
}
