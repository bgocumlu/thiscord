import type { UserPreferences } from '@thiscord/shared'
import { useEffect } from 'react'
import {
  applyAppearance,
  persistAppearance,
  type AppearanceTheme,
  type StoredAppearance,
} from '../../lib/appearance'

export function useUserAppearance(preferences: UserPreferences | undefined) {
  const themePreference = (preferences?.theme ?? 'dark') as AppearanceTheme
  const compactMode = Boolean(preferences?.compactMode)
  const reduceMotion = Boolean(preferences?.reduceMotion)

  useEffect(() => {
    const colorMedia = window.matchMedia('(prefers-color-scheme: light)')
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    const appearance: StoredAppearance = {
      theme: themePreference,
      compactMode,
      reduceMotion,
    }
    const apply = () => {
      applyAppearance(appearance, colorMedia.matches, motionMedia.matches)
    }
    persistAppearance(appearance)
    apply()
    colorMedia.addEventListener('change', apply)
    motionMedia.addEventListener('change', apply)
    return () => {
      colorMedia.removeEventListener('change', apply)
      motionMedia.removeEventListener('change', apply)
    }
  }, [compactMode, reduceMotion, themePreference])
}
