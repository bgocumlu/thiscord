import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const distributionFile = process.env.DISTRIBUTION_FILE
  ? resolve(repositoryRoot, process.env.DISTRIBUTION_FILE)
  : ''
const publicBasePath = `/${(process.env.PUBLIC_BASE_PATH ?? '').replace(/^\/+|\/+$/g, '')}`
  .replace(/\/$/, '') + '/'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'thiscord-distribution-manifest',
      closeBundle() {
        if (distributionFile) {
          if (!existsSync(distributionFile)) {
            throw new Error(`Distribution manifest not found: ${distributionFile}`)
          }
          const distribution = JSON.parse(readFileSync(distributionFile, 'utf8')) as {
            id: string
            name: string
            accent: string
          }
          const distPath = resolve(import.meta.dirname, 'dist')
          copyFileSync(distributionFile, resolve(distPath, 'distribution.json'))
          writeFileSync(resolve(distPath, 'manifest.webmanifest'), JSON.stringify({
            id: distribution.id,
            name: distribution.name,
            short_name: distribution.name.slice(0, 30),
            description: `${distribution.name} brings communities, messages, voice, and video together.`,
            start_url: './',
            scope: './',
            display: 'standalone',
            orientation: 'any',
            background_color: '#0d0f13',
            theme_color: distribution.accent,
            categories: ['social', 'productivity'],
            icons: [
              { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
              { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
              { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            ],
          }, null, 2))
          const indexPath = resolve(distPath, 'index.html')
          const brandedHtml = readFileSync(indexPath, 'utf8')
            .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(distribution.name)}</title>`)
            .replace(
              /<meta name="application-name" content="[^"]*"\s*\/?>/,
              `<meta name="application-name" content="${escapeHtml(distribution.name)}" />`,
            )
            .replace(
              /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
              `<meta name="description" content="${escapeHtml(distribution.name)} brings communities, messages, voice, and video together." />`,
            )
          writeFileSync(indexPath, brandedHtml)
        }
        copyFileSync(
          resolve(import.meta.dirname, 'dist/index.html'),
          resolve(import.meta.dirname, 'dist/404.html'),
        )
      },
    },
  ],
  base: publicBasePath,
  build: {
    // The call engine is intentionally deferred; exact budgets are enforced after each build.
    chunkSizeWarningLimit: 1_100,
    rollupOptions: {
      output: {
        // Keep the i18n runtime and source locale independently cacheable and budgeted.
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/')
          if (normalizedId.includes('/src/locales/en/')) return 'i18n-en'
          if (normalizedId.includes('/node_modules/i18next/')) return 'i18next'
          return undefined
        },
      },
    },
  },
  server: {
    port: Number(process.env.PORT ?? 5173),
    strictPort: true,
    hmr: {
      host: process.env.VITE_HMR_HOST ?? '127.0.0.1',
      clientPort: Number(process.env.VITE_HMR_PORT ?? process.env.PORT ?? 5173),
    },
  },
  define: {
    'import.meta.env.VITE_POCKETBASE_URL': JSON.stringify(process.env.VITE_POCKETBASE_URL ?? ''),
    'import.meta.env.VITE_JITSI_DOMAIN': JSON.stringify(process.env.VITE_JITSI_DOMAIN ?? ''),
  },
})

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
