export interface AudioOutputElement {
  setSinkId?: (deviceId: string) => Promise<void>
}

export async function setAudioOutputDevice(
  element: AudioOutputElement,
  deviceId: string,
) {
  if (!element.setSinkId) {
    if (deviceId) throw new Error('Speaker selection is not supported by this browser.')
    return false
  }
  await element.setSinkId(deviceId)
  return true
}
