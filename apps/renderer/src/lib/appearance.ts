export type AppearanceTheme = 'dark' | 'light' | 'system'

export interface StoredAppearance {
  readonly theme: AppearanceTheme
  readonly compactMode: boolean
  readonly reduceMotion: boolean
}

const appearanceStorageKey = 'thiscord:appearance:v1'
const defaultAppearance: StoredAppearance = {
  theme: 'system',
  compactMode: false,
  reduceMotion: false,
}

export function themeColorFor(theme: Exclude<AppearanceTheme, 'system'>) {
  return theme === 'light' ? '#f4f5f7' : '#111216'
}

function isAppearanceTheme(value: unknown): value is AppearanceTheme {
  return value === 'dark' || value === 'light' || value === 'system'
}

export function readStoredAppearance(): StoredAppearance {
  try {
    const raw = localStorage.getItem(appearanceStorageKey)
    if (!raw) return defaultAppearance
    const value = JSON.parse(raw) as Partial<StoredAppearance>
    return {
      theme: isAppearanceTheme(value.theme) ? value.theme : defaultAppearance.theme,
      compactMode: Boolean(value.compactMode),
      reduceMotion: Boolean(value.reduceMotion),
    }
  } catch {
    return defaultAppearance
  }
}

export function persistAppearance(appearance: StoredAppearance) {
  try {
    localStorage.setItem(appearanceStorageKey, JSON.stringify(appearance))
  } catch {
    // Storage can be unavailable in private or hardened browser contexts.
  }
}

export function resolveAppearanceTheme(theme: AppearanceTheme, systemLight: boolean) {
  return theme === 'system' ? systemLight ? 'light' : 'dark' : theme
}

export function applyAppearance(
  appearance: StoredAppearance,
  systemLight = window.matchMedia('(prefers-color-scheme: light)').matches,
  systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
) {
  const resolvedTheme = resolveAppearanceTheme(appearance.theme, systemLight)
  document.documentElement.dataset.theme = resolvedTheme
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute('content', themeColorFor(resolvedTheme))
  document.documentElement.classList.toggle('compact-mode', appearance.compactMode)
  document.documentElement.classList.toggle(
    'reduce-motion',
    appearance.reduceMotion || systemReducedMotion,
  )
}
