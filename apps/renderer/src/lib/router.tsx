/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface NavigateOptions {
  readonly replace?: boolean
}

interface RouterValue {
  readonly pathname: string
  readonly search: string
  readonly navigate: (path: string, options?: NavigateOptions) => void
}

const RouterContext = createContext<RouterValue | null>(null)
const basePath = import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL.replace(/\/$/, '')

function currentAppPath() {
  const browserPath = window.location.pathname
  if (basePath && (browserPath === basePath || browserPath.startsWith(`${basePath}/`))) {
    return browserPath.slice(basePath.length) || '/'
  }
  return browserPath
}

function safePath(path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error('Invalid internal navigation target.')
  }
  return path
}

export function AppRouter({ children }: { readonly children: ReactNode }) {
  const [location, setLocation] = useState(() => ({ pathname: currentAppPath(), search: window.location.search }))
  useEffect(() => {
    const onPopState = () => setLocation({ pathname: currentAppPath(), search: window.location.search })
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])
  const navigate = useCallback((path: string, options?: NavigateOptions) => {
    const target = safePath(path)
    window.history[options?.replace ? 'replaceState' : 'pushState']({}, '', `${basePath}${target}`)
    setLocation({ pathname: currentAppPath(), search: window.location.search })
  }, [])
  const value = useMemo(() => ({ pathname: location.pathname, search: location.search, navigate }), [location, navigate])
  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
}

export function useAppRouter() {
  const value = useContext(RouterContext)
  if (!value) throw new Error('AppRouter is missing.')
  return value
}
