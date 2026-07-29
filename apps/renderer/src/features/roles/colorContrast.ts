import { ensureContrastColor } from '../../lib/colorContrast'

const DARK_SURFACE = '#14171d'
const DARK_COPY = '#f3f4f8'
const LIGHT_SURFACE = '#ffffff'
const LIGHT_COPY = '#20232a'

export { contrastRatio } from '../../lib/colorContrast'

export function roleTextColors(requested: string) {
  return {
    dark: ensureContrastColor(requested, DARK_SURFACE, DARK_COPY),
    light: ensureContrastColor(requested, LIGHT_SURFACE, LIGHT_COPY),
  }
}
