import { t } from '../../lib/i18n'

export interface AudioOutputElement {
  setSinkId?: (deviceId: string) => Promise<void>
}

export async function setAudioOutputDevice(
  element: AudioOutputElement,
  deviceId: string,
) {
  if (!element.setSinkId) {
    if (deviceId) {
      throw new Error(t("calls.speakerOutput.selectionUnsupported"))
    }
    return false
  }
  await element.setSinkId(deviceId)
  return true
}
