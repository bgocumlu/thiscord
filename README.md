# Electron Template

Production-focused Electron starter with a generated Vite + React renderer, secure Electron shell, an Electron-owned local backend, portable packaging scripts, and optional CI wrappers.

## Stack

- Electron main/preload built with esbuild
- Vite 8 + React 19 renderer from `create-vite`
- Minimal Electron-owned local backend using built-in `http`
- `electron-builder` packaging
- `electron-updater` hooks
- npm workspaces

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run package:dir
npm run package -- --platform win --arch x64
npm run release -- --provider generic --channel latest
```

Set `APP_OPEN_DEVTOOLS=1` before `npm run dev` if you want Electron DevTools to open automatically.

## App Shape

Development:

```text
Vite dev server       -> Electron BrowserWindow
Local backend process -> renderer API calls
Electron main         -> native shell, updater, IPC
```

Production:

```text
Electron main starts the local backend with ELECTRON_RUN_AS_NODE
Local backend serves apps/renderer/dist
BrowserWindow loads local backend URL
```

The backend in this template is owned by the desktop app. It is for local APIs, static renderer serving, and desktop-adjacent work that should ship inside Electron. It is not intended to model a public product backend or hosted API service.

This keeps production close to the packaged app shape while still preserving Vite HMR during development.

## Updates

The default updater target is generic HTTPS storage:

```bash
UPDATE_PROVIDER=generic
UPDATE_URL=https://updates.example.com/stable
RELEASE_CHANNEL=latest
```

Upload the installer files, `*.yml`, and `*.blockmap` files from `release/` to the configured update URL.

GitHub Releases are optional:

```bash
UPDATE_PROVIDER=github
UPDATE_REPOSITORY=owner/repo
npm run release -- --provider github --channel latest
```

## Signing

Unsigned local builds are supported by default.

Set `MAC_SIGN=true` and the standard electron-builder Apple signing/notarization environment variables for signed macOS builds.

Set `WIN_SIGN=true` and configure your Windows signing provider for signed Windows builds.

## Layout

```text
apps/desktop       Electron main/preload and updater IPC
apps/renderer      Vite React renderer
apps/local-backend Electron-owned local backend and static renderer server
packages/shared    shared API and IPC types
scripts            portable dev/package/release/smoke scripts
```

## Optional Web App

If your product also needs a hosted web app, add it as a separate workspace such as `apps/web`. Keep public web/API concerns there or in your hosted backend, and keep `apps/local-backend` focused on desktop-local behavior that the packaged Electron app starts and owns.
