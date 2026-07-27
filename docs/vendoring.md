# Vendored dependencies

Thiscord vendors the third-party components that form part of its owned client
and backend boundary. Ordinary npm tooling and the Jitsi server containers
remain externally fetched.

## Inventory

```text
packages/pocketbase/vendor/pocketbase/0.39.9/
  LICENSE.md
  UPSTREAM_CHECKSUMS.txt
  linux_amd64/
    pocketbase
    SHA256SUMS
  linux_arm64/
    pocketbase
    SHA256SUMS

vendor/jitsi/
  PROVENANCE.md
  lib-jitsi-meet/
  rtcstats/
```

The PocketBase Docker build selects the binary using Docker's `TARGETARCH` and
verifies its extracted-binary checksum before installing it.

The renderer uses local npm `file:` dependencies for lib-jitsi-meet and
rtcstats. Their runtime dependencies remain normal lockfile-controlled npm
packages.

## What remains external

- Jitsi Web, Prosody, Jicofo, and Jitsi Videobridge container images
- Caddy and Coturn container images
- Alpine packages used by the PocketBase runtime image
- Ordinary npm, Electron, and packaging dependencies

These should be version-pinned and may later be digest-pinned or mirrored
without putting the complete Jitsi server source into this repository.

## Updating PocketBase

1. Download the new official Linux AMD64 and ARM64 archives plus the release
   checksum file.
2. Verify both archives before extraction.
3. Store the extracted binaries, their SHA-256 files, upstream checksums, and
   license under a new version directory.
4. Update `POCKETBASE_VERSION` in the PocketBase Docker build configuration.
5. Build both target architectures and run the PocketBase smoke suite.
6. Keep the previous version until the new container and data migration have
   been verified.

## Updating the Jitsi client

1. Update the Jitsi server tag and lib-jitsi-meet release together.
2. Verify the release archive integrity before replacing the vendor directory.
3. Exclude nested `node_modules` and remove development-only package metadata.
4. Compare the new rtcstats package with `THISCORD_PATCH.md`.
5. Regenerate `package-lock.json` with the repository npm version.
6. Run `npm audit --omit=dev`, all project checks, a production build, and
   multi-client audio/video/screen-sharing tests.

Never edit vendored runtime code without documenting the change in its vendor
note and `THIRD_PARTY_NOTICES.md`.
