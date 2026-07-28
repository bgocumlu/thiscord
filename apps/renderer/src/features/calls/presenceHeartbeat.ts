export interface IntervalScheduler {
  readonly setInterval: (callback: () => void, delayMs: number) => number
  readonly clearInterval: (id: number) => void
}

export interface PresenceHeartbeat {
  readonly start: (
    report: () => Promise<void>,
    onFailure: (error: unknown) => void,
    immediate?: boolean,
    initialReport?: () => Promise<void>,
  ) => void
  readonly stop: () => Promise<void>
  readonly active: () => boolean
}

export function createPresenceHeartbeat(
  intervalMs: number,
  scheduler: IntervalScheduler,
): PresenceHeartbeat {
  let timer: number | null = null
  let pending = Promise.resolve()
  const enqueue = (
    report: () => Promise<void>,
    onFailure: (error: unknown) => void,
  ) => {
    pending = pending.then(report).catch(onFailure)
    return pending
  }
  return {
    start(report, onFailure, immediate = true, initialReport = report) {
      if (timer !== null) scheduler.clearInterval(timer)
      if (immediate) void enqueue(initialReport, onFailure)
      timer = scheduler.setInterval(() => void enqueue(report, onFailure), intervalMs)
    },
    async stop() {
      if (timer !== null) {
        scheduler.clearInterval(timer)
        timer = null
      }
      await pending
    },
    active: () => timer !== null,
  }
}
