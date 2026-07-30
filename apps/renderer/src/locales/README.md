# Renderer translations

The renderer uses i18next with stable semantic keys and a complete English
source catalog. The official i18next CLI extracts keys, synchronizes locale
files, checks interpolation arguments and missing translations, and generates
TypeScript definitions.

To add a language:

1. Add its base locale to `supportedLocales` in `lib/locale.ts`.
2. Add the locale to `locales` in `i18next.config.ts`.
3. Add its date and time formatters to `components/workspaceUtils.ts`.
4. Run `npm run i18n:extract -w @thiscord/renderer` to synchronize catalogs
   and generated types.
5. Translate the generated `locales/<locale>/translation.json` values. Keep
   interpolation names and i18next JSON v4 plural suffixes intact.
6. Add the catalog to `localeLoaders` in `lib/i18n.ts`. Keep non-English
   catalogs behind dynamic imports so users download only their active locale.
7. Add the locale to the local-only language control. Use
   `setLocalePreference`; `auto` removes the override and resumes browser or
   operating-system detection. The renderer subscribes to i18next changes so
   language updates preserve drafts and other in-memory interface state.
8. Add locale, interpolation, and pluralization coverage to the i18n tests.

Normal repository checks and production builds run the official extraction,
type, status, and lint checks in read-only CI mode.
