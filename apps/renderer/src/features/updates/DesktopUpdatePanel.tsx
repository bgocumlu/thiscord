import { t } from '../../lib/i18n'
import type { UpdateState } from '@thiscord/shared'
import { useEffect, useState } from 'react'

const updateStatusKeys = {
  disabled: 'updates.panel.status.disabled',
  idle: 'updates.panel.status.idle',
  checking: 'updates.panel.status.checking',
  available: 'updates.panel.status.available',
  downloading: 'updates.panel.status.downloading',
  downloaded: 'updates.panel.status.downloaded',
  'not-available': 'updates.panel.status.notAvailable',
  error: 'updates.panel.status.error',
} as const satisfies Record<UpdateState['status'], string>

export function DesktopUpdatePanel() {
  const desktop = window.desktop!
  const [state, setState] = useState<UpdateState | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let active = true
    void desktop.getUpdateState().then((value) => {
      if (active) setState(value)
    })
    return () => {
      active = false
    }
  }, [desktop])
  const run = async (operation: () => Promise<UpdateState>) => {
    setBusy(true)
    try {
      setState(await operation())
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="desktop-updates">
      <span><strong>{t("updates.panel.desktopUpdates")}</strong><small>{state
        ? t(updateStatusKeys[state.status])
        : t("updates.panel.loading")}</small></span>
      {state?.status === 'available' ? <button type="button" onClick={() => void run(desktop.downloadUpdate)}>{t("updates.panel.download")} {state.availableVersion}</button> : null}
      {state?.status === 'downloaded' ? <button type="button" onClick={() => void desktop.installUpdate()}>{t("updates.panel.restartAndInstall")}</button> : null}
      {!state || ['idle', 'not-available', 'error'].includes(state.status) ? <button type="button" disabled={busy} onClick={() => void run(desktop.checkForUpdates)}>{busy ? t("updates.panel.checking") : t("updates.panel.checkForUpdates")}</button> : null}
      {state?.status === 'downloading' ? <progress value={state.percent} max="100" /> : null}
      {state?.status === 'error' ? <p>{state.message}</p> : null}
    </section>
  )
}
