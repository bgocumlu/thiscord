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

Authenticate the GitHub CLI and store the public deployment configuration in
GitHub Actions repository variables. These values are deployment configuration,
not secrets:

```powershell
gh auth login
gh auth status

$distribution = Get-Content "infra/distribution.local.json" -Raw
gh variable set DISTRIBUTION_JSON --repo bgocumlu/thiscord --body $distribution
gh variable set PUBLIC_BASE_PATH --repo bgocumlu/thiscord --body "/thiscord/"
gh workflow enable pages.yml --repo bgocumlu/thiscord
```

Keep GitHub Pages configured to serve the root of the `gh-pages` branch:

```powershell
gh api --method PUT repos/bgocumlu/thiscord/pages `
  -f 'source[branch]=gh-pages' `
  -f 'source[path]=/' `
  -f 'build_type=legacy'
```

The `Deploy frontend to GitHub Pages` workflow now builds and updates this
branch automatically on every push to `main`. It can also be started manually:

```powershell
gh workflow run pages.yml --repo bgocumlu/thiscord --ref main
gh run list --repo bgocumlu/thiscord --workflow pages.yml --limit 1
```

## Publish directly from this computer

The following remains available as a manual fallback. From the repository root,
install dependencies, validate the public endpoints, build with the repository
base path, and publish the output:

```powershell
npm ci

$env:DISTRIBUTION_FILE = "infra/distribution.local.json"
$env:PUBLIC_BASE_PATH = "/thiscord/"

node scripts/validate-web-config.mjs
npm run build --workspace @thiscord/shared
npm run build --workspace @thiscord/renderer
npx --yes gh-pages@6.3.0 --dist apps/renderer/dist --branch gh-pages --nojekyll --message "deploy: frontend"
```

If the Pages site does not exist yet, create it from the new branch:

```powershell
gh api --method POST repos/bgocumlu/thiscord/pages `
  -f 'source[branch]=gh-pages' `
  -f 'source[path]=/' `
  -f 'build_type=legacy'
```

The first publication can take a few minutes.

## Manual future frontend updates

Run these commands from the repository root whenever the frontend changes:

```powershell
git switch main
git pull --ff-only
npm ci

$env:DISTRIBUTION_FILE = "infra/distribution.local.json"
$env:PUBLIC_BASE_PATH = "/thiscord/"

node scripts/validate-web-config.mjs
npm run build --workspace @thiscord/shared
npm run build --workspace @thiscord/renderer
npx --yes gh-pages@6.3.0 --dist apps/renderer/dist --branch gh-pages --nojekyll --message "deploy: frontend"
```

Do not edit the generated `gh-pages` branch manually. Its contents are replaced
from `apps/renderer/dist`.
