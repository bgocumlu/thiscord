import { transientTimings } from '@thiscord/shared'

export const MAX_AUTOMATIC_RECONNECTS = transientTimings.automaticReconnectDelaysMs.length

export interface AutomaticReconnectDecision {
  readonly attempt: number
  readonly delayMs: number
}

export function automaticReconnectAfter(completedAttempts: number): AutomaticReconnectDecision | null {
  const attempt = completedAttempts + 1
  if (attempt > MAX_AUTOMATIC_RECONNECTS) return null
  return {
    attempt,
    delayMs: transientTimings.automaticReconnectDelaysMs[attempt - 1],
  }
}
