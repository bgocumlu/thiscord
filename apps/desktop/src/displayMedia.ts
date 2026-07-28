import type { DesktopCapturerSource } from "electron";

export function displayMediaStreams(
  source: DesktopCapturerSource | undefined,
  audioRequested: boolean,
  shareSystemAudio: boolean,
  platform = process.platform,
) {
  if (!source) return {};
  return {
    video: source,
    ...(audioRequested && shareSystemAudio && platform === "win32"
      ? { audio: "loopback" as const }
      : {}),
  };
}
