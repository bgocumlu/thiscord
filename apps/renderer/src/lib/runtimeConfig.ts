import type { DistributionConfig } from '@thiscord/shared'
import { z } from 'zod'

const distributionSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().min(1).max(100),
  appId: z.string().min(1).max(160),
  webUrl: z.string(),
  pocketBaseUrl: z.string().min(1),
  jitsiDomain: z.string().min(1),
  supportUrl: z.string(),
  updateUrl: z.string(),
  accent: z.string().regex(/^#[0-9a-f]{6}$/i),
})

const defaults: DistributionConfig = {
  id: 'thiscord',
  name: 'Thiscord',
  appId: 'chat.thiscord.app',
  webUrl: new URL(import.meta.env.BASE_URL, window.location.origin).toString().replace(/\/$/, ''),
  pocketBaseUrl: import.meta.env.DEV ? 'http://127.0.0.1:8090' : window.location.origin,
  jitsiDomain: import.meta.env.DEV ? '127.0.0.1:8443' : `meet.${window.location.hostname}`,
  supportUrl: '',
  updateUrl: '',
  accent: '#6957e8',
}

function contrastColor(hex: string) {
  const channels = [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
  const luminance = channels
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0)
  const whiteContrast = 1.05 / (luminance + 0.05)
  const darkContrast = (luminance + 0.05) / 0.05
  return whiteContrast >= darkContrast ? '#ffffff' : '#0c0d11'
}

let manifestUrl = ''

function applyRuntimeBranding(config: DistributionConfig) {
  document.title = config.name
  document.documentElement.style.setProperty('--brand-accent', config.accent)
  document.documentElement.style.setProperty('--accent-contrast', contrastColor(config.accent))
  const manifest = {
    id: config.id,
    name: config.name,
    short_name: config.name.slice(0, 30),
    description: config.name,
    theme_color: config.accent,
    background_color: '#0d0f13',
    display: 'standalone',
    orientation: 'any',
    scope: './',
    start_url: './',
    categories: ['social', 'productivity'],
    icons: [
      { src: `${import.meta.env.BASE_URL}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: `${import.meta.env.BASE_URL}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      { src: `${import.meta.env.BASE_URL}favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
    ],
  }
  if (manifestUrl) URL.revokeObjectURL(manifestUrl)
  manifestUrl = URL.createObjectURL(new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' }))
  document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute('href', manifestUrl)
  document.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.setAttribute('content', config.name)
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', config.accent)
}

export async function loadRuntimeConfig(): Promise<DistributionConfig> {
  let fileConfig: Partial<DistributionConfig> = {}
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}distribution.json`, { cache: 'no-store' })
    if (response.ok) fileConfig = await response.json() as Partial<DistributionConfig>
  } catch {
    // The built-in defaults keep local and packaged clients bootable.
  }

  const candidate = {
    ...defaults,
    ...fileConfig,
    pocketBaseUrl: import.meta.env.VITE_POCKETBASE_URL || fileConfig.pocketBaseUrl || defaults.pocketBaseUrl,
    jitsiDomain: import.meta.env.VITE_JITSI_DOMAIN || fileConfig.jitsiDomain || defaults.jitsiDomain,
  }
  const config = distributionSchema.parse(candidate)
  applyRuntimeBranding(config)
  return config
}
