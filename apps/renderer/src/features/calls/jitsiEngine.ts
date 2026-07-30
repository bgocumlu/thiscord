import type {
  JitsiConference,
  JitsiConnection,
  JitsiMeetApi,
  JitsiTrack,
} from 'lib-jitsi-meet'
import { transientTimings } from '@thiscord/shared'
import type { CallTarget } from '@thiscord/shared'
import { t } from '../../lib/i18n'
import { errorMessage } from '../../lib/pocketbase'

export interface JitsiEngineResources {
  connection: JitsiConnection | null
  conference: JitsiConference | null
  localTracks: JitsiTrack[]
  screenAudio: {
    capturedTrack: JitsiTrack
    microphoneTrack: JitsiTrack
  } | null
}

const JITSI_RELOAD_AT_KEY = 'thiscord_jitsi_reload_at'
const JITSI_RESUME_TARGET_KEY = 'thiscord_call_resume_target'
let loadedApi: JitsiMeetApi | null = null
let loadingApi: Promise<JitsiMeetApi> | null = null

function isJitsiMeetApi(value: unknown): value is JitsiMeetApi {
  return Boolean(
    value
    && typeof value === 'object'
    && 'init' in value
    && typeof value.init === 'function',
  )
}

export function resolveJitsiApi(module: unknown, globalApi?: unknown): JitsiMeetApi {
  const moduleRecord = module && typeof module === 'object'
    ? module as { readonly default?: unknown }
    : {}
  const defaultRecord = moduleRecord.default && typeof moduleRecord.default === 'object'
    ? moduleRecord.default as { readonly default?: unknown }
    : {}
  const candidate = [
    moduleRecord.default,
    defaultRecord.default,
    module,
    globalApi,
  ].find(isJitsiMeetApi)
  if (!candidate) throw new Error(t("calls.jitsiEngine.moduleApiUnavailable"))
  return candidate
}

export function currentJitsiApi() {
  return loadedApi
}

export function markJitsiModuleFresh() {
  sessionStorage.removeItem(JITSI_RELOAD_AT_KEY)
}

export function createEngineResources(): JitsiEngineResources {
  return { connection: null, conference: null, localTracks: [], screenAudio: null }
}

export function isStaleJitsiModule(caught: unknown) {
  const message = errorMessage(caught)
  return /failed to fetch dynamically imported module|importing a module script failed|error loading dynamically imported module/i.test(message)
}

export function readResumeCallTarget(): CallTarget | null {
  const raw = sessionStorage.getItem(JITSI_RESUME_TARGET_KEY)
  if (!raw) return null
  try {
    const value = JSON.parse(raw) as Partial<CallTarget>
    const target = (value.kind === 'channel' || value.kind === 'conversation') && typeof value.id === 'string'
      ? { kind: value.kind, id: value.id }
      : null
    if (!target) sessionStorage.removeItem(JITSI_RESUME_TARGET_KEY)
    return target
  } catch {
    sessionStorage.removeItem(JITSI_RESUME_TARGET_KEY)
    return null
  }
}

export function clearResumeCallTarget() {
  sessionStorage.removeItem(JITSI_RESUME_TARGET_KEY)
}

export async function reloadForFreshJitsiModule(target: CallTarget) {
  const lastReload = Number(sessionStorage.getItem(JITSI_RELOAD_AT_KEY) || 0)
  if (Date.now() - lastReload < transientTimings.jitsiReloadCooldownMs) return false
  sessionStorage.setItem(JITSI_RELOAD_AT_KEY, String(Date.now()))
  sessionStorage.setItem(JITSI_RESUME_TARGET_KEY, JSON.stringify(target))
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations().catch(() => [])
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
  if ('caches' in window) {
    const keys = await caches.keys().catch(() => [])
    await Promise.all(keys.flatMap((key) => (
      key.startsWith('thiscord-') ? [caches.delete(key)] : []
    )))
  }
  const freshUrl = new URL(window.location.href)
  freshUrl.searchParams.set('thiscord-refresh', String(Date.now()))
  window.location.replace(freshUrl)
  return true
}

export async function loadJitsiEngine() {
  if (!loadingApi) {
    loadingApi = import('lib-jitsi-meet').then((module) => {
      const api = resolveJitsiApi(
        module,
        (globalThis as typeof globalThis & { readonly JitsiMeetJS?: unknown }).JitsiMeetJS,
      )
      api.init({
        disableAudioLevels: false,
        disableThirdPartyRequests: true,
        enableAnalyticsLogging: false,
        flags: { runInLiteMode: true },
      })
      if (api.logLevels.ERROR) api.setLogLevel(api.logLevels.ERROR)
      loadedApi = api
      return api
    }).catch((caught: unknown) => {
      loadingApi = null
      throw caught
    })
  }
  return loadingApi
}

export function mediaErrorMessage(caught: unknown, device: 'microphone' | 'camera' | 'screen') {
  const message = errorMessage(caught)
  if (/denied|notallowed|permission/i.test(message)) {
    if (device === 'screen') return t("calls.jitsiEngine.screenSharingWasCancelledOrBlocked")
    return device === 'microphone'
      ? t("calls.jitsiEngine.microphoneAccessIsBlockedInThisAppsPermissions")
      : t("calls.jitsiEngine.cameraAccessIsBlockedInThisAppsPermissions")
  }
  if (/not found|notfound/i.test(message)) {
    return device === 'screen'
      ? t("calls.jitsiEngine.screenSharingIsNotAvailableInThisBrowser")
      : t("calls.jitsiEngine.noDeviceWasFound", {
          device: device === 'microphone'
            ? t("calls.jitsiEngine.microphone")
            : t("calls.jitsiEngine.camera"),
        })
  }
  return message
}

export function jitsiConnectionOptions(origin: string) {
  const base = new URL(origin)
  return {
    enableWebsocketResume: false,
    hosts: {
      domain: 'meet.jitsi',
      muc: 'muc.meet.jitsi',
    },
    p2pStunServers: [],
    serviceUrl: new URL('/http-bind', base).toString(),
    websocketKeepAlive: 0,
  }
}
