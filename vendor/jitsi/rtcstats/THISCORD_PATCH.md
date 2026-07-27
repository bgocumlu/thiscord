# Thiscord patch

This vendored copy is based on `@jitsi/rtcstats` 9.7.1.

Thiscord changes its `uuid` dependency from `^8.3.2` to `11.1.1`. The package
uses the compatible named `v4` export in `trace-ws.js`. This removes
GHSA-w5hq-g745-h8pq from the installed production dependency tree without
changing rtcstats behavior.

When updating rtcstats, compare this patch with upstream and remove it once
upstream depends on a patched UUID release.
