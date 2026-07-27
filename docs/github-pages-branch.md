# Publish the frontend to `gh-pages`

This publishes only the static frontend to:

```text
https://bgocumlu.github.io/thiscord/
```

PocketBase, Jitsi, and TURN remain on the VPS. Docker is not involved in the
frontend deployment.

## One-time configuration

Create `infra/distribution.local.json` with the installation's public
configuration:

```json
{
  "id": "thiscord",
  "name": "Thiscord",
  "appId": "chat.thiscord.app",
  "webUrl": "https://bgocumlu.github.io/thiscord/",
  "pocketBaseUrl": "https://api.thiscord.sesivo.app",
  "jitsiDomain": "meet.thiscord.sesivo.app",
  "supportUrl": "",
  "updateUrl": "",
  "accent": "#6957e8"
}
```

`infra/distribution.local.json` is ignored by Git. It configures the local
deployment build without changing or committing the repository's tracked
distribution manifest.

Authenticate the GitHub CLI and disable the repository's Actions-based Pages
workflow. This prevents it from competing with the `gh-pages` branch:

```powershell
gh auth login
gh auth status
gh workflow disable pages.yml --repo bgocumlu/thiscord
```

From the repository root, install dependencies, validate the public endpoints,
build with the repository base path, and publish the output:

```powershell
npm ci

$env:DISTRIBUTION_FILE = "infra/distribution.local.json"
$env:PUBLIC_BASE_PATH = "/thiscord/"

node scripts/validate-web-config.mjs
npm run build --workspace @thiscord/renderer
npx --yes gh-pages@6.3.0 --dist apps/renderer/dist --branch gh-pages --nojekyll --message "deploy: frontend"
```

Create the GitHub Pages site from the new branch:

```powershell
gh api --method POST repos/bgocumlu/thiscord/pages `
  -f 'source[branch]=gh-pages' `
  -f 'source[path]=/' `
  -f 'build_type=legacy'
```

If GitHub says the Pages site already exists, update it instead:

```powershell
gh api --method PUT repos/bgocumlu/thiscord/pages `
  -f 'source[branch]=gh-pages' `
  -f 'source[path]=/' `
  -f 'build_type=legacy'
```

The first publication can take a few minutes.

## Publish future frontend updates

Run these commands from the repository root whenever the frontend changes:

```powershell
git switch main
git pull --ff-only
npm ci

$env:DISTRIBUTION_FILE = "infra/distribution.local.json"
$env:PUBLIC_BASE_PATH = "/thiscord/"

node scripts/validate-web-config.mjs
npm run build --workspace @thiscord/renderer
npx --yes gh-pages@6.3.0 --dist apps/renderer/dist --branch gh-pages --nojekyll --message "deploy: frontend"
```

Do not edit the generated `gh-pages` branch manually. Its contents are replaced
from `apps/renderer/dist`.

## Current workflow failures

The first Pages workflow failed because GitHub Pages was not enabled for the
repository. The branch setup above enables it after creating `gh-pages`.

The separate CI failure is unrelated to Pages. All checks reached the final
`npm audit --omit=dev` step, which reports the known moderate `uuid`
vulnerability inherited from `lib-jitsi-meet`. Publishing the static frontend
does not depend on that audit step.
