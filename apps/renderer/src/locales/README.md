# Renderer translations

The renderer uses i18next with stable semantic keys and a complete English
source catalog. The official i18next CLI extracts keys, synchronizes locale
files, checks interpolation arguments and missing translations, and generates
TypeScript definitions.

To add a language:

1. Add its canonical locale and native display name to `supportedLocales` and
   `localeMetadata` in `lib/locale.ts`. For a regional-only catalog such as
   `pt-BR`, add a base-language default when automatic detection should map
   other regional variants to it.
2. Add the locale to `locales` in `i18next.config.ts`.
3. Run `npm run i18n:extract -w @thiscord/renderer` to synchronize catalogs
   and generated types.
4. Translate the generated `locales/<locale>/translation.json` values. Keep
   interpolation names and i18next JSON v4 plural suffixes intact.
5. Add the catalog to `localeLoaders` in `lib/i18n.ts`. Keep non-English
   catalogs behind dynamic imports so users download only their active locale.
6. Add locale, interpolation, and pluralization coverage to the i18n tests.

The local-only language control and date/time formatters are generated from
`supportedLocales`. `setLocalePreference` stores an explicit choice in local
storage; `auto` removes the override and resumes browser or operating-system
detection. The renderer subscribes to i18next changes so language updates
preserve drafts and other in-memory interface state.

Normal repository checks and production builds run the official extraction,
type, status, and lint checks in read-only CI mode.
