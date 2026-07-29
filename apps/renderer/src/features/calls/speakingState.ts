export interface SpeakingStateStore {
  readonly subscribe: (participantId: string, listener: () => void) => () => void
  readonly getSnapshot: (participantId: string) => boolean
  readonly set: (participantId: string, speaking: boolean) => void
  readonly delete: (participantId: string) => void
  readonly clear: () => void
}

const SPEAKING_START_LEVEL = 0.18
const SPEAKING_STOP_LEVEL = 0.1

export function resolveSpeakingState(current: boolean, level: number) {
  return current ? level > SPEAKING_STOP_LEVEL : level > SPEAKING_START_LEVEL
}

export function createSpeakingStateStore(): SpeakingStateStore {
  const speaking = new Set<string>()
  const listeners = new Map<string, Set<() => void>>()

  const emit = (participantId: string) => {
    for (const listener of listeners.get(participantId) ?? []) listener()
  }

  return {
    subscribe(participantId, listener) {
      const participantListeners = listeners.get(participantId) ?? new Set()
      participantListeners.add(listener)
      listeners.set(participantId, participantListeners)
      return () => {
        participantListeners.delete(listener)
        if (!participantListeners.size) listeners.delete(participantId)
      }
    },
    getSnapshot(participantId) {
      return speaking.has(participantId)
    },
    set(participantId, value) {
      if (speaking.has(participantId) === value) return
      if (value) speaking.add(participantId)
      else speaking.delete(participantId)
      emit(participantId)
    },
    delete(participantId) {
      if (!speaking.delete(participantId)) return
      emit(participantId)
    },
    clear() {
      const activeParticipants = [...speaking]
      speaking.clear()
      for (const participantId of activeParticipants) emit(participantId)
    },
  }
}
