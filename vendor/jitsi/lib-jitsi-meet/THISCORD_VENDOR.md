# Thiscord vendor note

This directory contains the runtime package from the
`v2156.0.0+3884dbd5` lib-jitsi-meet release.

Thiscord removed upstream development dependencies and build/test scripts from
`package.json`. This prevents a local `file:` dependency from installing
Jitsi's development toolchain. No shipped runtime JavaScript, source maps,
types, README content, or license text was changed.

See `../PROVENANCE.md` for the original archive and integrity value.
