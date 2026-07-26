import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'
import type { DesktopApi } from '@thiscord/shared'
import { AuthProvider } from './auth/AuthProvider'
import { PocketBaseContext, RuntimeContext } from './lib/contexts'
import { createPocketBase } from './lib/pocketbase'
import { loadRuntimeConfig } from './lib/runtimeConfig'

declare global {
  interface Window {
    desktop?: DesktopApi
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

async function bootstrap() {
  const config = await loadRuntimeConfig()
  const pocketBase = await createPocketBase(config)
  if (!window.desktop && 'serviceWorker' in navigator) {
    if (import.meta.env.PROD) {
      void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
        scope: import.meta.env.BASE_URL,
      }).catch(() => undefined)
    } else {
      void navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .then(() => caches.keys())
        .then((keys) => Promise.all(keys.filter((key) => key.startsWith('thiscord-')).map((key) => caches.delete(key))))
        .catch(() => undefined)
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <RuntimeContext.Provider value={config}>
        <PocketBaseContext.Provider value={pocketBase}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <App />
            </AuthProvider>
          </QueryClientProvider>
        </PocketBaseContext.Provider>
      </RuntimeContext.Provider>
    </StrictMode>,
  )
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unable to start Thiscord.'
  createRoot(document.getElementById('root')!).render(
    <main className="fatal-startup">
      <h1>Thiscord could not start</h1>
      <p>{message}</p>
    </main>,
  )
})
