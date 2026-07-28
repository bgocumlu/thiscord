import { createCoalescedReporter } from '../../lib/coalescedReporter'

export interface IntervalScheduler {
  readonly setInterval: (callback: () => void, delayMs: number) => number
  readonly clearInterval: (id: number) => void
}

type PreparedReport = () => Promise<void>
type PrepareReport = () => PreparedReport | null

export interface PresenceHeartbeat {
  readonly start: (
    prepare: PrepareReport,
    onFailure: (error: unknown) => void,
    immediate?: boolean,
    prepareInitial?: PrepareReport,
  ) => void
  readonly update: (
    prepare: PrepareReport,
    onFailure: (error: unknown) => void,
  ) => void
  readonly stop: () => void
  readonly active: () => boolean
  readonly idle: () => Promise<void>
}

export function createPresenceHeartbeat(
  intervalMs: number,
  scheduler: IntervalScheduler,
): PresenceHeartbeat {
  let timer: number | null = null
  let failureHandler: (error: unknown) => void = () => undefined
  const reporter = createCoalescedReporter((error) => failureHandler(error))
  const enqueue = (prepare: PrepareReport, onFailure: (error: unknown) => void) => {
    failureHandler = onFailure
    const prepared = prepare()
    if (prepared) reporter.submit(prepared)
  }
  return {
    start(prepare, onFailure, immediate = true, prepareInitial = prepare) {
      if (timer !== null) scheduler.clearInterval(timer)
      reporter.clearPending()
      if (immediate) enqueue(prepareInitial, onFailure)
      timer = scheduler.setInterval(() => enqueue(prepare, onFailure), intervalMs)
    },
    update: enqueue,
    stop() {
      if (timer !== null) {
        scheduler.clearInterval(timer)
        timer = null
      }
      reporter.clearPending()
    },
    active: () => timer !== null,
    idle: () => reporter.idle(),
  }
}
