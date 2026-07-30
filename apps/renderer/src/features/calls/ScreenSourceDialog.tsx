import { t } from '../../lib/i18n'
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
          <span><h2 id="screen-source-title">{t("calls.screenSourceDialog.shareYourScreen")}</h2><p>{t("calls.screenSourceDialog.chooseADisplayOrWindow")}</p></span>
          <button type="button" onClick={onClose}>{t("calls.screenSourceDialog.cancel")}</button>
        </header>
        <label>
          <input
            type="checkbox"
            checked={shareSystemAudio}
            onChange={(event) => setShareSystemAudio(event.target.checked)}
          />

          {t("calls.screenSourceDialog.shareSystemAudio")}
        </label>
        <div className="screen-source-grid">
          {sources.map((source) => (
            <button
              type="button"
              onClick={() => onSelect(source.id, shareSystemAudio)}
              key={source.id}
            >
              <img
                src={source.thumbnailUrl}
                alt=""
                width={320}
                height={180}
                decoding="async"
              />
              <span>{source.appIconUrl ? (
                <img
                  src={source.appIconUrl}
                  alt=""
                  width={18}
                  height={18}
                  decoding="async"
                />
              ) : null}<strong>{source.name}</strong></span>
            </button>
          ))}
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </section>
    </dialog>
  )
}
