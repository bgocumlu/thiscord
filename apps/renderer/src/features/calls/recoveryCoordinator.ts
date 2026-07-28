import {
  automaticReconnectAfter,
  MAX_AUTOMATIC_RECONNECTS,
} from './reconnectPolicy'

export interface TimeoutScheduler {
  readonly setTimeout: (callback: () => void, delayMs: number) => number
  readonly clearTimeout: (id: number) => void
}

export interface RecoveryCoordinator {
  readonly recover: (reason: string) => boolean
  readonly reset: () => void
  readonly cancel: () => void
  readonly attempts: () => number
  readonly scheduled: () => boolean
}

export function createRecoveryCoordinator({
  scheduler,
  onScheduled,
  onRetry,
  onExhausted,
}: {
  readonly scheduler: TimeoutScheduler
  readonly onScheduled: (message: string, attempt: number) => void
  readonly onRetry: () => void
  readonly onExhausted: () => void
}): RecoveryCoordinator {
  let attempts = 0
  let timer: number | null = null
  const cancel = () => {
    if (timer === null) return
    scheduler.clearTimeout(timer)
    timer = null
  }
  return {
    recover(reason) {
      if (timer !== null) return true
      const decision = automaticReconnectAfter(attempts)
      if (!decision) {
        onExhausted()
        return false
      }
      attempts = decision.attempt
      onScheduled(
        `${reason} Reconnecting (${decision.attempt}/${MAX_AUTOMATIC_RECONNECTS})…`,
        decision.attempt,
      )
      timer = scheduler.setTimeout(() => {
        timer = null
        onRetry()
      }, decision.delayMs)
      return true
    },
    reset() {
      attempts = 0
      cancel()
    },
    cancel,
    attempts: () => attempts,
    scheduled: () => timer !== null,
  }
}
