import { ensureContrastColor } from './colorContrast'

function contrastColor(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const luminance = channels
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0)
  const whiteContrast = 1.05 / (luminance + 0.05)
  const darkContrast = (luminance + 0.05) / 0.05
  return whiteContrast >= darkContrast ? '#ffffff' : '#0c0d11'
}

export function runtimeAccentTokens(accent: string) {
  return {
    contrast: contrastColor(accent),
    darkEmphasis: ensureContrastColor(accent, '#0d0f13', '#f3f4f8'),
    lightEmphasis: ensureContrastColor(accent, '#f4f5f7', '#20232a'),
  }
}
