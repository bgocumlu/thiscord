# Production Checklist

- Replace `APP_ID`, `APP_NAME`, and package metadata.
- Add real application icons in `build/` and wire them in `electron-builder.config.cjs`.
- Decide update hosting: generic HTTPS storage or GitHub Releases.
- Configure stable and prerelease channels before first public release.
- Add macOS Developer ID signing and notarization secrets.
- Add Windows signing, preferably Azure Trusted Signing or an EV/OV certificate flow.
- Test installed artifacts on every supported OS.
- Keep renderer navigation locked to trusted origins.
- Expose only narrow preload APIs; never enable Node in the renderer.
- Keep release scripts runnable locally and from any CI provider.
- Upload every update metadata file produced by electron-builder.
