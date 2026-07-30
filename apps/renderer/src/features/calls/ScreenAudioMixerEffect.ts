import type {
  JitsiAudioMixer,
  JitsiMeetApi,
  JitsiStreamEffect,
  JitsiTrack,
} from 'lib-jitsi-meet'
import { t } from '../../lib/i18n'

/**
 * Mixes captured display audio into the microphone track Jitsi already
 * publishes. Muting the resulting track disables only the microphone input,
 * leaving shared system audio audible.
 */
export class ScreenAudioMixerEffect implements JitsiStreamEffect {
  private audioMixer: JitsiAudioMixer | null = null
  private readonly capturedAudioTrack: JitsiTrack
  private readonly jitsi: JitsiMeetApi
  private originalMicrophoneTrack: MediaStreamTrack | null = null

  constructor(jitsi: JitsiMeetApi, capturedAudioTrack: JitsiTrack) {
    this.jitsi = jitsi
    this.capturedAudioTrack = capturedAudioTrack
  }

  isEnabled(sourceTrack: JitsiTrack) {
    return sourceTrack.isAudioTrack() && this.capturedAudioTrack.isAudioTrack()
  }

  startEffect(microphoneStream: MediaStream) {
    const microphoneTrack = microphoneStream.getAudioTracks()[0]
    if (!microphoneTrack) {
      throw new Error(t("calls.screenAudioMixer.microphoneTrackUnavailable"))
    }

    const mixer = this.jitsi.createAudioMixer()
    mixer.addMediaStream(this.capturedAudioTrack.getOriginalStream())
    mixer.addMediaStream(microphoneStream)
    const mixedStream = mixer.start()
    if (!mixedStream?.getAudioTracks().length) {
      mixer.reset()
      throw new Error(t("calls.screenAudioMixer.mixFailed"))
    }

    this.audioMixer = mixer
    this.originalMicrophoneTrack = microphoneTrack
    return mixedStream
  }

  stopEffect() {
    this.audioMixer?.reset()
    this.audioMixer = null
    this.originalMicrophoneTrack = null
  }

  setMuted(muted: boolean) {
    if (this.originalMicrophoneTrack) this.originalMicrophoneTrack.enabled = !muted
  }

  isMuted() {
    return this.originalMicrophoneTrack ? !this.originalMicrophoneTrack.enabled : false
  }
}
