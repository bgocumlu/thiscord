const avatarPalette = [
  '#5a4fcf',
  '#7a3e9d',
  '#25647a',
  '#2f6b4f',
  '#8a4a20',
  '#8b3d55',
  '#465a75',
  '#7a4436',
] as const

export const avatarContrast = '#ffffff'

export function avatarColor(identity: string) {
  let hash = 2166136261
  for (const character of identity) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 16777619)
  }
  return avatarPalette[(hash >>> 0) % avatarPalette.length]
}

export function avatarPaletteColors() {
  return avatarPalette
}
