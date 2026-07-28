import type { UserPreferences } from '@thiscord/shared'
import { useEffect } from 'react'

export function useUserAppearance(preferences: UserPreferences | undefined) {
  const themePreference = preferences?.theme
  const compactMode = Boolean(preferences?.compactMode)
  const reduceMotion = Boolean(preferences?.reduceMotion)

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const apply = () => {
      const theme = themePreference === 'system'
        ? media.matches ? 'light' : 'dark'
        : themePreference === 'light' ? 'light' : 'dark'
      document.documentElement.dataset.theme = theme
      document.documentElement.classList.toggle('compact-mode', compactMode)
      document.documentElement.classList.toggle('reduce-motion', reduceMotion)
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [compactMode, reduceMotion, themePreference])
}
