import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: ['en', 'tr'],
  extract: {
    input: ['src/**/*.{ts,tsx}'],
    ignore: ['src/locales/**', 'src/types/**'],
    output: 'src/locales/{{language}}/{{namespace}}.json',
    primaryLanguage: 'en',
    keySeparator: '.',
    nsSeparator: ':',
    removeUnusedKeys: true,
    sort: true,
    indentation: 2,
    warnOnConflicts: 'error',
  },
  lint: {
    checkInterpolationParams: true,
    ignore: ['src/locales/**', 'src/types/**'],
  },
  types: {
    input: ['src/locales/en/*.json'],
    output: 'src/types/i18next.d.ts',
    resourcesFile: 'src/types/i18next-resources.d.ts',
    enableSelector: false,
  },
})
