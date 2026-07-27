# PocketBase administration

## Open the dashboard

Local:

```text
http://127.0.0.1:8090/_/
```

Production:

```text
https://api.example.com/_/
```

The plain `/_/` URL is the dashboard login page. On a new database, PocketBase
prints a temporary, tokenized first-superuser URL to its logs. Retrieve it from
the Compose directory:

```bash
install_path="$(
  docker compose logs pocketbase --no-log-prefix |
    grep -oE '/_/#/pbinstall/[A-Za-z0-9._-]+' |
    tail -1
)"
printf 'https://api.example.com%s\n' "$install_path"
```

Replace `api.example.com` with the PocketBase domain, open the printed URL, and
create the first superuser. Do not share or commit the URL because it contains
a temporary setup token. If the link has expired while the database still has
no real superuser, restart only PocketBase and run the command again:

```bash
docker compose restart pocketbase
```

PocketBase may temporarily store `__pbinstaller@example.com` while this setup
link is active. That is its built-in installer account, not a dashboard account
created by Thiscord.

Alternatively, create or replace a dashboard superuser directly from the
machine running Compose:

```bash
docker compose exec pocketbase pocketbase superuser upsert admin@example.com "a-password-manager-generated-password" --dir=/app/pb_data
```

For local Compose, add `-f compose.local.yml` after `docker compose`.

A PocketBase superuser manages the database and server settings. It is not a
Thiscord account. Create an ordinary account in Thiscord to participate in
communities; community owners and roles are managed inside Thiscord.

## What to manage in the dashboard

- **Collections:** inspect records and schema. Change schema through committed
  migrations, not manual production edits.
- **Settings → Mail settings:** configure SMTP before relying on verification
  or password-reset email.
- **Settings → Files storage:** local storage is default; S3-compatible storage
  is optional.
- **Settings → Backups:** create, download, restore, and delete PocketBase
  backups.
- **Settings → Application:** configure rate limits and other server settings.
- **Superusers:** use a unique account, enable MFA, and restrict dashboard
  access to trusted IPs or a VPN where practical.

The main collections are `users`, `communities`, `memberships`, `roles`,
`channels`, `messages`, `conversations`, `direct_messages`, `notifications`,
and `audit_events`. Thiscord hooks enforce privileged mutations; do not loosen
collection API rules to work around an authorization error.

## Useful commands

```bash
# Status and recent logs
docker compose ps
docker compose logs --tail 200 pocketbase

# Follow logs
docker compose logs -f pocketbase

# Restart only PocketBase
docker compose restart pocketbase

# Open the PocketBase command help
docker compose exec pocketbase pocketbase --help

# List superuser commands
docker compose exec pocketbase pocketbase superuser --help
```

The database, uploaded files, settings, and backups live in the
`thiscord_pocketbase_data` Docker volume. Recreating a container does not erase
that volume. Never run `docker compose down --volumes` on production.

## Backup and restore

The simplest consistent backup is **Settings → Backups → Create backup**. Save
copies away from the VPS and test restoring them on a separate installation.

Before an upgrade:

1. Create and download a backup.
2. Read the PocketBase changelog.
3. Test the pinned version change against a copy of the data.
4. Deploy during a maintenance window.

PocketBase is pinned in `packages/pocketbase/Dockerfile`/Compose rather than
using a floating image. It is still pre-1.0 software, so treat upgrades as
reviewed migrations rather than unattended updates.

## Security notes

The public API must be reachable by the web and desktop apps. Security comes
from authentication, collection rules, and protected hooks—not from hiding the
API or CORS. `POCKETBASE_ORIGINS=*` supports GitHub Pages, local development,
and Electron's loopback origin. A web-only fork can restrict it to a comma-
separated origin list after testing every client.

Configure SMTP, rate limiting, superuser MFA, off-host backups, and dashboard
network restrictions before a public launch.
