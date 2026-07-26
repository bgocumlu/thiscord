import { useEffect, useState } from 'react'
import './App.css'

type Health = {
  ok: true
  appVersion: string
  mode: 'development' | 'production'
}

function App() {
  const [version, setVersion] = useState('...')
  const [health, setHealth] = useState<Health | null>(null)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking')

  useEffect(() => {
    void window.desktop?.getVersion().then(setVersion)

    const backendUrl = import.meta.env.VITE_APP_BACKEND_URL || window.location.origin
    void fetch(`${backendUrl}/api/health`)
      .then((response) => {
        if (!response.ok) throw new Error(`Health check failed with ${response.status}`)
        return response.json() as Promise<Health>
      })
      .then((nextHealth) => {
        setHealth(nextHealth)
        setBackendStatus('connected')
      })
      .catch(() => {
        setHealth(null)
        setBackendStatus('offline')
      })
  }, [])

  return (
    <main>
      <section className="shell">
        <header className="titlebar">
          <div>
            <p className="eyebrow">Electron + Vite + React</p>
            <h1>Desktop app template</h1>
          </div>
          <span className={`status ${backendStatus}`}>{backendStatus}</span>
        </header>

        <section className="summary">
          <h2>Production-ready local foundation</h2>
          <p>
            Secure preload bridge, packaged renderer, Electron-owned local backend, updater hooks, and portable
            release scripts.
          </p>
        </section>

        <dl className="metrics">
          <div>
            <dt>App version</dt>
            <dd>{version}</dd>
          </div>
          <div>
            <dt>Backend mode</dt>
            <dd>{health?.mode ?? 'checking'}</dd>
          </div>
          <div>
            <dt>Backend version</dt>
            <dd>{health?.appVersion ?? 'checking'}</dd>
          </div>
        </dl>
      </section>
    </main>
  )
}

export default App
