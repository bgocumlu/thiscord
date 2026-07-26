import type { DesktopApi, StoredAuthSession, UpdateState } from "@thiscord/shared";
import { contextBridge, ipcRenderer } from "electron";
import { channels } from "./channels.js";

const desktop: DesktopApi = {
  getVersion: () => ipcRenderer.invoke(channels.getVersion) as Promise<string>,
  getAuthSession: () => ipcRenderer.invoke(channels.getAuthSession) as Promise<StoredAuthSession | null>,
  setAuthSession: (session) => ipcRenderer.invoke(channels.setAuthSession, session) as Promise<void>,
  clearAuthSession: () => ipcRenderer.invoke(channels.clearAuthSession) as Promise<void>,
  getUpdateState: () => ipcRenderer.invoke(channels.updateState) as Promise<UpdateState>,
  checkForUpdates: () => ipcRenderer.invoke(channels.checkForUpdates) as Promise<UpdateState>,
  downloadUpdate: () => ipcRenderer.invoke(channels.downloadUpdate) as Promise<UpdateState>,
  installUpdate: () => ipcRenderer.invoke(channels.installUpdate) as Promise<{ readonly accepted: boolean }>,
  getDisplaySources: () => ipcRenderer.invoke(channels.getDisplaySources) as ReturnType<DesktopApi["getDisplaySources"]>,
  selectDisplaySource: (sourceId) => ipcRenderer.invoke(channels.selectDisplaySource, sourceId) as Promise<void>
};

contextBridge.exposeInMainWorld("desktop", desktop);
