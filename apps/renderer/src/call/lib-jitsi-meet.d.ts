declare module 'lib-jitsi-meet' {
  export interface JitsiTrack {
    addEventListener(event: string, listener: (...args: unknown[]) => void): void
    attach(element: HTMLElement): Promise<void>
    detach(element?: HTMLElement): void
    dispose(): Promise<void>
    getParticipantId(): string
    getType(): 'audio' | 'video'
    getSourceName(): string | null | undefined
    getVideoType(): 'camera' | 'desktop' | 'desktop_high_fps'
    isLocal(): boolean
    isMuted(): boolean
    mute(): Promise<void>
    removeEventListener(event: string, listener: (...args: unknown[]) => void): void
    unmute(): Promise<void>
  }

  export interface JitsiParticipant {
    getDisplayName(): string
    getId(): string
  }

  export interface JitsiConference {
    addEventListener(event: string, listener: (...args: unknown[]) => void): void
    addTrack(track: JitsiTrack): Promise<void>
    getParticipants(): JitsiParticipant[]
    join(): void
    kickParticipant(participantId: string): void
    leave(reason?: string): Promise<void>
    muteParticipant(participantId: string, mediaType: 'audio' | 'video'): void
    removeEventListener(event: string, listener: (...args: unknown[]) => void): void
    removeTrack(track: JitsiTrack): Promise<void>
    setReceiverConstraints(constraints: {
      lastN?: number
      defaultConstraints?: { maxHeight: number }
      constraints?: Record<string, { maxHeight: number }>
    }): void
    setDisplayName(name: string): void
  }

  export interface JitsiConnection {
    addEventListener(event: string, listener: (...args: unknown[]) => void): void
    connect(options?: { name?: string }): void
    disconnect(): boolean | Promise<void>
    initJitsiConference(name: string, options: Record<string, unknown>): JitsiConference
    removeEventListener(event: string, listener: (...args: unknown[]) => void): void
  }

  export interface JitsiMeetApi {
    JitsiConnection: new (
      appId: string | null,
      token: string,
      options: Record<string, unknown>,
    ) => JitsiConnection
    createLocalTracks(options: {
      devices: Array<'audio' | 'video' | 'desktop'>
      resolution?: string
      micDeviceId?: string
      cameraDeviceId?: string
    }): Promise<JitsiTrack[]>
    events: {
      conference: Record<string, string>
      connection: Record<string, string>
      track: Record<string, string>
    }
    init(options: Record<string, unknown>): void
    logLevels: Record<string, unknown>
    setLogLevel(level: unknown): void
  }

  const JitsiMeetJS: JitsiMeetApi
  export default JitsiMeetJS
}
