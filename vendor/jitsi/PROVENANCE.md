# Jitsi client provenance

## lib-jitsi-meet

- Upstream release: `v2156.0.0+3884dbd5`
- Upstream archive:
  `https://github.com/jitsi/lib-jitsi-meet/releases/download/v2156.0.0+3884dbd5/lib-jitsi-meet.tgz`
- Upstream archive integrity:
  `sha512-QtK9U8bgPn8gBxJIlnMkzIQ5HMk/Hr+gdZgYRJqAZxdq2rfxwQPENxoUiB7EQVqe30L5ShBQfKl4iFZg087e8g==`
- License: Apache-2.0

The vendored runtime payload came from the npm-installed release archive after
npm verified that integrity value. Nested `node_modules` were excluded.
Development dependencies and build scripts were removed from the vendored
`package.json`; shipped runtime code, maps, types, README, and license remain.

## @jitsi/rtcstats

- Upstream version: `9.7.1`
- Upstream archive:
  `https://registry.npmjs.org/@jitsi/rtcstats/-/rtcstats-9.7.1.tgz`
- Upstream archive integrity:
  `sha512-a8LVqzlBNh/fLnDfE4HcnutQ8Dpki31wmHw2pMS5Qu+shhzfZKUSb2NimPXT0l7WwkFqVflYGiQhfsavXPcMog==`
- License: MIT

Nested `node_modules` were excluded. Development dependencies and scripts were
removed. The production UUID dependency is the only functional package change;
see `rtcstats/THISCORD_PATCH.md`.
