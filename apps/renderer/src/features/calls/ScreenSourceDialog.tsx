import type { DesktopCaptureSource } from '@thiscord/shared'
import { useState } from 'react'

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
  if (!sources.length) return null

  return (
    <div className="modal-backdrop screen-picker-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose()
    }}>
      <section className="screen-source-picker" role="dialog" aria-modal="true" aria-labelledby="screen-source-title">
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
    </div>
  )
}
