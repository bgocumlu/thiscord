import type { UpdateState } from '@thiscord/shared'
import { useEffect, useState } from 'react'

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
      <span><strong>Desktop updates</strong><small>{state ? state.status.replace(/-/g, ' ') : 'Loading…'}</small></span>
      {state?.status === 'available' ? <button type="button" onClick={() => void run(desktop.downloadUpdate)}>Download {state.availableVersion}</button> : null}
      {state?.status === 'downloaded' ? <button type="button" onClick={() => void desktop.installUpdate()}>Restart and install</button> : null}
      {!state || ['idle', 'not-available', 'error'].includes(state.status) ? <button type="button" disabled={busy} onClick={() => void run(desktop.checkForUpdates)}>{busy ? 'Checking…' : 'Check for updates'}</button> : null}
      {state?.status === 'downloading' ? <progress value={state.percent} max="100" /> : null}
      {state?.status === 'error' ? <p>{state.message}</p> : null}
    </section>
  )
}
