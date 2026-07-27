# Operations

## Routine backend management

Connect to the VPS and enter the deployed repository before running Compose
commands:

```bash
ssh user@your-vps
cd ~/thiscord
```

Inspect the deployment:

```bash
# Container state and published ports
docker compose ps

# Recent logs from every backend service
docker compose logs --tail 200

# Follow one service; use pocketbase, gateway, web, prosody, jicofo, jvb, or coturn
docker compose logs -f pocketbase

# Validate the resolved Compose configuration
docker compose config --quiet

# Host and Docker disk usage
df -h
docker system df
```

Restart or recreate only what is needed:

```bash
# Briefly restart one service
docker compose restart pocketbase

# Reconcile all services with the current configuration
docker compose up -d

# Rebuild the locally built PocketBase image after a repository update
docker compose up -d --build pocketbase
```

Deploy a reviewed repository update:

```bash
git status --short
git pull --ff-only
docker compose config --quiet
docker compose pull
docker compose up -d --build
docker compose ps
```

`docker compose pull` updates only services that use registry images. The
repository pins PocketBase and Jitsi versions, so review and commit version
changes before upgrading them. Do not use `docker compose down --volumes` in
production; it removes persistent application data. PocketBase-specific
dashboard, superuser, backup, and restore commands are in
[PocketBase administration](pocketbase.md).

## Backups

PocketBase’s backup API and administrator UI create consistent application backups. Store backups outside the Docker host and test restoration regularly.

For a cold volume snapshot:

```bash
mkdir -p backups
docker compose stop pocketbase
docker run --rm \
  -v thiscord_pocketbase_data:/data:ro \
  -v "$PWD/backups:/backup" \
  alpine:3.22 \
  tar czf /backup/pocketbase-data.tar.gz -C /data .
docker compose start pocketbase
```

Jitsi configuration volumes can be recreated from environment configuration. Caddy volumes contain certificate state but are not the source of product data.

## Restore

Stop PocketBase before replacing its data volume. Preserve the current volume until the restored instance has been verified. Restore into a new volume where possible, attach that volume to a temporary deployment, run health and login checks, and only then switch production.

## Upgrades

PocketBase and Jitsi are intentionally pinned:

```text
PocketBase 0.39.9
Jitsi stable-10978
lib-jitsi-meet 2156.0.0+3884dbd5
```

For each upgrade:

1. Read upstream release notes and migration notes.
2. Create and verify a backup.
3. Update the Jitsi images and the matched `lib-jitsi-meet` release in one
   change. Do not upgrade the browser client independently of the media stack.
4. Run `npm run check` and the PocketBase smoke test against the new binary.
5. Start a staging copy of the Compose deployment.
6. Test registration, login, messaging, uploads, realtime updates, and a multi-party Jitsi call.
7. Deploy during a maintenance window and retain the previous images and backup.

PocketBase is pre-1.0, so upgrades must never be performed by an unattended floating tag.

## Monitoring

Monitor:

- Caddy HTTP error rates and certificate renewal;
- PocketBase health, process restarts, disk use, and backup age;
- JVB CPU, packet loss, bitrate, and UDP reachability;
- Coturn allocation failures and relay bandwidth;
- host disk, memory, load, and network saturation.

`docker compose ps` should show PocketBase as healthy. The public PocketBase
health endpoint is `https://POCKETBASE_DOMAIN/api/health`.

## Incident controls

Rotate `JITSI_APP_SECRET` in PocketBase and every Jitsi component together. Existing meeting tokens expire within five minutes. Rotate Jicofo, JVB, and TURN credentials by updating `.env` and recreating the affected containers.

If an administrator credential is exposed, revoke it from PocketBase immediately and review `audit_events`, PocketBase request logs, and reverse-proxy logs.

## Release limits and dependency advisories

The renderer's production dependency audit is currently clean. Thiscord vendors
`@jitsi/rtcstats` with its compatible UUID dependency patched to remove the
previous Jitsi advisory. Keep that patch documented and recheck
`npm audit --omit=dev` after every coordinated Jitsi upgrade; see
[Vendored dependencies](vendoring.md).

The full development audit also reports high-severity advisories in
`electron-builder`'s packaging dependency tree. Those packages run during
trusted local/CI builds and are not shipped in the renderer. Do not feed
untrusted archives or file globs to the packaging pipeline; update
`electron-builder` when its upstream dependency tree is fixed. Do not downgrade
to an older builder solely because `npm audit fix` suggests it.

Windows unpacked packaging and startup are covered by the automated package
smoke test. Release candidates must still be built and exercised on native
Windows, macOS, and Linux runners. Test code signing/notarization, protocol
links, updates, login persistence, microphone/camera permissions, screen
sharing, and a two-client call before publishing installers.
