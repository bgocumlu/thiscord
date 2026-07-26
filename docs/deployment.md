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

Clone the repository on the VPS, then:

```bash
cp .env.example .env
```

Edit `.env`. Set the static frontend URL, the three backend domains, the VPS
public IP, an ACME email, and fresh random secrets. Then:

```bash
docker compose config --quiet
docker compose pull
docker compose up -d --build
docker compose ps
```

Caddy obtains TLS certificates. PocketBase is available at
`https://api.example.com`; its administration UI is
`https://api.example.com/_/`.

The setup helper can generate `.env` and a matching desktop/frontend manifest:

```bash
npm run setup:self-host -- --frontend-url https://username.github.io/thiscord --pocketbase-domain api.example.com --jitsi-domain meet.example.com --turn-domain turn.example.com --public-ip 203.0.113.10 --email admin@example.com
```

## Frontend on GitHub Pages

Edit `infra/distribution.json`:

```json
{
  "webUrl": "https://username.github.io/thiscord",
  "pocketBaseUrl": "https://api.example.com",
  "jitsiDomain": "meet.example.com"
}
```

Keep the other keys in the file. In GitHub:

1. Open **Settings → Pages** and choose **GitHub Actions** as the source.
2. If the site is at `https://username.github.io/repository/`, no variable is
   needed.
3. For a user site or custom domain, create the Actions repository variable
   `PUBLIC_BASE_PATH` with value `/`.
4. Push to `main` or run the **Deploy frontend to GitHub Pages** workflow.

The workflow validates the public URLs, builds the static PWA, and publishes
only `apps/renderer/dist`. Backend secrets are never placed in the frontend;
PocketBase and Jitsi endpoints are public configuration.

Any static provider can host the same output:

```bash
$env:DISTRIBUTION_FILE="infra/distribution.json"
$env:PUBLIC_BASE_PATH="/"
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
