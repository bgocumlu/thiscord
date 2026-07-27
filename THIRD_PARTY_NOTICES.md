# Third-party notices

## PocketBase

Thiscord vendors PocketBase 0.39.9 Linux AMD64 and ARM64 executables for the
backend container. PocketBase is distributed under the MIT License.

Upstream: <https://github.com/pocketbase/pocketbase>

The original release checksums, extracted-binary checksums, and license are
stored beside the binaries in
`packages/pocketbase/vendor/pocketbase/0.39.9`.

## lib-jitsi-meet

Thiscord bundles `lib-jitsi-meet` version `2156.0.0+3884dbd5`, matched to the
pinned Jitsi Meet `stable-10978` backend. It is distributed under the
Apache License 2.0.

Upstream: <https://github.com/jitsi/lib-jitsi-meet>

The release package is vendored in `vendor/jitsi/lib-jitsi-meet`. Its
development-only package metadata was removed so npm installs only the shipped
runtime package and production dependencies. Runtime code, built files, types,
and the upstream license are retained.

## @jitsi/rtcstats

Thiscord vendors `@jitsi/rtcstats` 9.7.1 under the MIT License.

Upstream: <https://github.com/jitsi/rtcstats>

The vendored package changes its UUID dependency from `^8.3.2` to `11.1.1`.
This removes GHSA-w5hq-g745-h8pq from the production dependency tree while
retaining the compatible named `v4` API used by rtcstats. Details are in
`vendor/jitsi/rtcstats/THISCORD_PATCH.md`.

Update the Jitsi backend and client packages together, then run the
PocketBase/Jitsi smoke flow and a real multi-client media test.
