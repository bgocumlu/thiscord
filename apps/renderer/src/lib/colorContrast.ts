type Rgb = readonly [number, number, number]

function parseHex(value: string): Rgb | null {
  const normalized = value.trim().toLowerCase()
  const match = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/)
  if (!match) return null
  const expanded = match[1].length === 3
    ? [...match[1]].map((character) => `${character}${character}`).join('')
    : match[1]
  return [
    Number.parseInt(expanded.slice(0, 2), 16),
    Number.parseInt(expanded.slice(2, 4), 16),
    Number.parseInt(expanded.slice(4, 6), 16),
  ]
}

function parseRgb(value: string): Rgb | null {
  const normalized = value.trim().toLowerCase()
  const match = normalized.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/,
  )
  if (!match) return null
  return [
    Number.parseFloat(match[1]),
    Number.parseFloat(match[2]),
    Number.parseFloat(match[3]),
  ].map((channel) => Math.max(0, Math.min(255, channel))) as unknown as Rgb
}

function parseColor(value: string) {
  return parseHex(value) ?? parseRgb(value)
}

function channelLuminance(value: number) {
  const channel = value / 255
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4
}

function luminance(color: Rgb) {
  return (
    0.2126 * channelLuminance(color[0])
    + 0.7152 * channelLuminance(color[1])
    + 0.0722 * channelLuminance(color[2])
  )
}

export function contrastRatio(foreground: string, background: string) {
  const foregroundRgb = parseColor(foreground)
  const backgroundRgb = parseColor(background)
  if (!foregroundRgb || !backgroundRgb) return 1
  const foregroundLuminance = luminance(foregroundRgb)
  const backgroundLuminance = luminance(backgroundRgb)
  return (
    Math.max(foregroundLuminance, backgroundLuminance) + 0.05
  ) / (
    Math.min(foregroundLuminance, backgroundLuminance) + 0.05
  )
}

function toHex(color: Rgb) {
  return `#${color.map((channel) => (
    Math.round(channel).toString(16).padStart(2, '0')
  )).join('')}`
}

function mix(start: Rgb, end: Rgb, amount: number): Rgb {
  return start.map((channel, index) => (
    channel + (end[index] - channel) * amount
  )) as unknown as Rgb
}

export function ensureContrastColor(
  requested: string,
  background: string,
  fallback: string,
  minimumContrast = 4.5,
) {
  const requestedRgb = parseHex(requested)
  const backgroundRgb = parseHex(background)
  const fallbackRgb = parseHex(fallback)
  if (!requestedRgb || !backgroundRgb || !fallbackRgb) return fallback
  const normalized = toHex(requestedRgb)
  if (contrastRatio(normalized, background) >= minimumContrast) return normalized

  let lower = 0
  let upper = 1
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const candidate = (lower + upper) / 2
    const candidateHex = toHex(mix(requestedRgb, fallbackRgb, candidate))
    if (contrastRatio(candidateHex, background) >= minimumContrast) {
      upper = candidate
    } else {
      lower = candidate
    }
  }
  return toHex(mix(requestedRgb, fallbackRgb, upper))
}
