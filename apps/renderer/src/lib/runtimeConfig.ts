import type { DistributionConfig } from '@thiscord/shared'
import * as z from 'zod/mini'
import { runtimeAccentTokens } from './brandAccent'
import { t } from './i18n'

const distributionSchema = z.object({
  id: z.string().check(z.minLength(1), z.maxLength(80)),
  name: z.string().check(z.minLength(1), z.maxLength(100)),
  appId: z.string().check(z.minLength(1), z.maxLength(160)),
  webUrl: z.string(),
  pocketBaseUrl: z.string().check(z.minLength(1)),
  jitsiDomain: z.string().check(z.minLength(1)),
  supportUrl: z.string(),
  updateUrl: z.string(),
  accent: z.string().check(z.regex(/^#[0-9a-f]{6}$/i)),
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

function applyRuntimeBranding(config: DistributionConfig) {
  const accentTokens = runtimeAccentTokens(config.accent)
  document.title = config.name
  document.documentElement.style.setProperty('--brand-accent', config.accent)
  document.documentElement.style.setProperty('--accent-contrast', accentTokens.contrast)
  document.documentElement.style.setProperty('--brand-accent-emphasis-dark', accentTokens.darkEmphasis)
  document.documentElement.style.setProperty('--brand-accent-emphasis-light', accentTokens.lightEmphasis)
  document.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.setAttribute('content', config.name)
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute(
    'content',
    t("runtimeConfig.description", { name: config.name }),
  )
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
