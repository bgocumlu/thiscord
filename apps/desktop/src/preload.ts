import type { DesktopApi, UpdateState } from "@template/shared";
import { contextBridge, ipcRenderer } from "electron";
import { channels } from "./channels.js";

const desktop: DesktopApi = {
  getVersion: () => ipcRenderer.invoke(channels.getVersion) as Promise<string>,
  getUpdateState: () => ipcRenderer.invoke(channels.updateState) as Promise<UpdateState>,
  checkForUpdates: () => ipcRenderer.invoke(channels.checkForUpdates) as Promise<UpdateState>,
  downloadUpdate: () => ipcRenderer.invoke(channels.downloadUpdate) as Promise<UpdateState>,
  installUpdate: () => ipcRenderer.invoke(channels.installUpdate) as Promise<{ readonly accepted: boolean }>
};

contextBridge.exposeInMainWorld("desktop", desktop);
