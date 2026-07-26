export const channels = {
  getVersion: "app:get-version",
  getAuthSession: "auth:get-session",
  setAuthSession: "auth:set-session",
  clearAuthSession: "auth:clear-session",
  updateState: "updates:state",
  checkForUpdates: "updates:check",
  downloadUpdate: "updates:download",
  installUpdate: "updates:install",
  getDisplaySources: "capture:get-sources",
  selectDisplaySource: "capture:select-source"
} as const;
