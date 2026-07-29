import { readdirSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const assetsDirectory = resolve(import.meta.dirname, '../dist/assets')
const assets = readdirSync(assetsDirectory)

const budgets = [
  {
    label: 'application entry',
    pattern: /^index-[\w-]+\.js$/,
    maximumBytes: 300_000,
  },
  {
    label: 'workspace',
    pattern: /^WorkspaceApp-[\w-]+\.js$/,
    maximumBytes: 125_000,
  },
  {
    label: 'rich messages',
    pattern: /^RichMessage-[\w-]+\.js$/,
    maximumBytes: 170_000,
  },
  {
    label: 'call engine',
    pattern: /^lib-jitsi-meet\.min-[\w-]+\.js$/,
    maximumBytes: 1_100_000,
  },
  {
    label: 'renderer styles',
    pattern: /^index-[\w-]+\.css$/,
    maximumBytes: 90_000,
  },
]

let failed = false

for (const budget of budgets) {
  const matches = assets.filter((asset) => budget.pattern.test(asset))
  if (matches.length !== 1) {
    console.error(
      `[bundle-budget] Expected one ${budget.label} asset, found ${matches.length}.`,
    )
    failed = true
    continue
  }

  const [asset] = matches
  const bytes = statSync(resolve(assetsDirectory, asset)).size
  const allowance = budget.maximumBytes - bytes
  const status = allowance >= 0 ? 'PASS' : 'FAIL'
  console.log(
    `[bundle-budget] ${status} ${budget.label}: ${formatBytes(bytes)}`
      + ` / ${formatBytes(budget.maximumBytes)}`,
  )
  if (allowance < 0) failed = true
}

if (failed) process.exit(1)

function formatBytes(bytes) {
  return `${(bytes / 1_000).toFixed(1)} kB`
}
