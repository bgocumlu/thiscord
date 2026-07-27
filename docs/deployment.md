# Deployment

## Backend on a VPS

Use a Linux VPS with Docker Engine, Docker Compose v2, a public IPv4 address,
and persistent disk. Four GB RAM is a practical starting point for light Jitsi
use; call traffic, not registered-user count, determines media capacity.

Create DNS records pointing to the VPS:

```text
api.example.com   PocketBase API and administrator UI
meet.example.com  Jitsi web and signaling
turn.example.com  TURN relay
```

Allow inbound:

```text
80/tcp, 443/tcp, 443/udp
10000/udp
3478/tcp, 3478/udp
49160-49200/udp
```

Clone the repository on the VPS and choose one configuration method.

For manual configuration:

```bash
cp .env.example .env
```

Edit `.env`. Set the static frontend URL, the three backend domains, the VPS
public IP, an ACME email, and fresh random secrets.

Alternatively, the setup helper can generate `.env` and a matching
desktop/frontend manifest:

```bash
npm run setup:self-host -- --frontend-url https://username.github.io/thiscord --pocketbase-domain api.example.com --jitsi-domain meet.example.com --turn-domain turn.example.com --public-ip 203.0.113.10 --email admin@example.com
```

Installing Node on the VPS is not required. Run the same helper in a temporary
Node container from the repository root:

```bash
docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$PWD:/workspace" \
  -w /workspace \
  node:24.10.0-alpine \
  npm run setup:self-host -- \
    --frontend-url https://username.github.io/thiscord \
    --pocketbase-domain api.example.com \
    --jitsi-domain meet.example.com \
    --turn-domain turn.example.com \
    --public-ip 203.0.113.10 \
    --email admin@example.com
```

The helper creates both files with fresh secrets and refuses to replace an
existing deployment configuration.

After either configuration method:

```bash
docker compose config --quiet
docker compose pull
docker compose up -d --build
docker compose ps
```

Caddy obtains TLS certificates. PocketBase is available at
`https://api.example.com`. Its root redirects to the administration UI at
`https://api.example.com/_/`; the health endpoint is
`https://api.example.com/api/health`.

## Frontend on GitHub Pages

Create the ignored `infra/distribution.local.json`:

```json
{
  "id": "thiscord",
  "name": "Thiscord",
  "appId": "chat.thiscord.app",
  "webUrl": "https://username.github.io/thiscord",
  "pocketBaseUrl": "https://api.example.com",
  "jitsiDomain": "meet.example.com",
  "supportUrl": "",
  "updateUrl": "",
  "accent": "#6957e8"
}
```

Store that public configuration and base path as repository variables:

```powershell
$distribution = Get-Content "infra/distribution.local.json" -Raw
gh variable set DISTRIBUTION_JSON --body $distribution
gh variable set PUBLIC_BASE_PATH --body "/thiscord/"
gh workflow enable pages.yml
```

In GitHub:

1. Open **Settings → Pages** and choose the root of the `gh-pages` branch.
2. Push to `main` for an automatic deployment, or run the
   **Deploy frontend to GitHub Pages** workflow manually.
3. The workflow validates the repository variables, builds the PWA, and updates
   `gh-pages`. GitHub Pages then publishes that branch.

The workflow validates the public URLs, builds the static PWA, and publishes
only `apps/renderer/dist`. Backend secrets are never placed in the frontend;
PocketBase and Jitsi endpoints are public configuration.

Any static provider can host the same output:

```bash
$env:DISTRIBUTION_FILE="infra/distribution.local.json"
$env:PUBLIC_BASE_PATH="/"
npm run build --workspace @thiscord/shared
npm run build --workspace @thiscord/renderer
```

Upload `apps/renderer/dist`.

## Decoupling PocketBase and Jitsi

The backend Compose file already uses separate containers and volumes.

- PocketBase-only host:
  `docker compose up -d --build gateway pocketbase`
- Media-only host:
  `docker compose up -d gateway jitsi-web prosody jicofo jvb coturn`

Use the same Caddy file on either host; unused domain routes simply have no
upstream. Point each DNS record at its corresponding host. On the PocketBase
host, keep `JITSI_DOMAIN` and `JITSI_URL` aimed at the media host.

PocketBase can also run on a container provider if it has a persistent volume
for `/app/pb_data`. Jitsi needs UDP port ranges and a publicly reachable media
address, which makes a VPS the simpler and more portable choice.

## Desktop distribution

Desktop packages consume the same distribution file:

```powershell
$env:DISTRIBUTION_FILE="infra/distribution.local.json"
$env:APP_NAME="Thiscord"
$env:APP_ID="chat.thiscord.app"
$env:APP_PROTOCOL="thiscord"
npm run validate:release
npm run package -- --platform win --arch x64
```

Use `mac` or `linux` for other targets. Public installers should be signed and
use an HTTPS update feed. Set the same four values as repository variables for
the release workflow; `APP_PROTOCOL` controls links such as
`thiscord://invite/CODE`.
