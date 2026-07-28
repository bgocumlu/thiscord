# Development

## Start

Docker runs the backend only:

```bash
docker compose -f compose.local.yml up -d --build
```

Run the frontend on the host:

```bash
npm install
npm run dev:web
```

This split lets frontend work continue while the backend is restarted, moved to
a testing VPS, or replaced with an external installation. Local defaults are:

```text
Frontend       http://127.0.0.1:5173
PocketBase     http://127.0.0.1:8090
PocketBase UI  http://127.0.0.1:8090/_/
Jitsi          http://127.0.0.1:8443
```

To point the frontend at a testing VPS instead, set these variables before
starting Vite:

```powershell
$env:VITE_POCKETBASE_URL="https://api.example.com"
$env:VITE_JITSI_DOMAIN="meet.example.com"
npm run dev:web
```

Electron uses the same backend:

```bash
npm run dev:desktop
```

## Inspect and stop

```bash
docker compose -f compose.local.yml ps
docker compose -f compose.local.yml logs -f pocketbase
docker compose -f compose.local.yml logs -f jitsi-web jicofo jvb prosody
docker compose -f compose.local.yml down
```

Named volumes preserve data after `down`. This destructive command also removes
local PocketBase and Jitsi data:

```bash
docker compose -f compose.local.yml down --volumes
```

## Checks

```bash
npm run check
npm run build
docker compose -f compose.local.yml config --quiet
docker compose --env-file .env.example config --quiet
```

Run the backend API smoke suite against a PocketBase binary:

```bash
POCKETBASE_BINARY=/absolute/path/to/pocketbase npm run smoke --workspace @thiscord/pocketbase
```

PowerShell:

```powershell
$env:POCKETBASE_BINARY="C:\absolute\path\to\pocketbase.exe"
npm run smoke --workspace @thiscord/pocketbase
```

This suite creates an isolated temporary database and covers ordinary-member
channel access, persisted permissions after restart, channel history denial,
role hierarchy, transactional invites, attachments, search, unread and
notification state, direct messages and reactions, concurrent presence,
account deletion relationships, and the voice occupancy lifecycle. It removes
the temporary database when finished.

Verify the unpacked Electron application on the current operating system:

```bash
npm run package:dir
npm run smoke:package
```

The package smoke test proves that the native executable starts and serves the
bundled renderer. Authentication, media permissions, camera, microphone,
screen-sharing, signing, and installers still require a manual release pass on
each target operating system and real devices.

Schema changes belong in `packages/pocketbase/pb_migrations`; authorized product
actions belong in `packages/pocketbase/pb_hooks`.

`1785031200_v2_baseline.js` creates the complete schema for a clean database,
including channel and conversation messaging, generic call rooms, ordered
private presence leases, privacy-safe presence aggregates, final access rules,
and quality repairs. Its collection importer also adopts a pre-baseline local
schema by collection name instead of colliding with existing indexes.

`1785254000_presence_schema_upgrade.js` is the forward migration for databases
that already recorded an earlier version of the baseline. It preserves durable
records, removes only obsolete transient device-presence rows, and installs the
ordered account/call lease collections. Back up any non-disposable data before
running migrations.

Never validate this reset against a data directory that may contain user data.
The PocketBase smoke suite creates and removes an isolated temporary directory;
manual migration checks should likewise pass a new `--dir` path under the
system temporary directory.
