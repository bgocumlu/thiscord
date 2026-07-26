export interface HealthResponse {
  readonly ok: true;
  readonly appVersion: string;
  readonly mode: "development" | "production";
}

export interface DesktopApi {
  readonly getVersion: () => Promise<string>;
  readonly getAuthSession: () => Promise<StoredAuthSession | null>;
  readonly setAuthSession: (session: StoredAuthSession) => Promise<void>;
  readonly clearAuthSession: () => Promise<void>;
  readonly getUpdateState: () => Promise<UpdateState>;
  readonly checkForUpdates: () => Promise<UpdateState>;
  readonly downloadUpdate: () => Promise<UpdateState>;
  readonly installUpdate: () => Promise<{ readonly accepted: boolean }>;
  readonly getDisplaySources: () => Promise<readonly DesktopCaptureSource[]>;
  readonly selectDisplaySource: (sourceId: string | null) => Promise<void>;
}

export interface DesktopCaptureSource {
  readonly id: string;
  readonly name: string;
  readonly thumbnailUrl: string;
  readonly appIconUrl: string;
}

export interface StoredAuthSession {
  readonly token: string;
  readonly record: Record<string, unknown>;
}

export type UpdateState =
  | { readonly status: "disabled"; readonly message: string }
  | { readonly status: "idle"; readonly currentVersion: string }
  | { readonly status: "checking"; readonly currentVersion: string }
  | { readonly status: "available"; readonly currentVersion: string; readonly availableVersion: string }
  | { readonly status: "downloading"; readonly currentVersion: string; readonly availableVersion: string; readonly percent: number }
  | { readonly status: "downloaded"; readonly currentVersion: string; readonly availableVersion: string }
  | { readonly status: "not-available"; readonly currentVersion: string }
  | { readonly status: "error"; readonly currentVersion: string; readonly message: string };

export * from "./domain.js";
export * from "./permissions.js";
