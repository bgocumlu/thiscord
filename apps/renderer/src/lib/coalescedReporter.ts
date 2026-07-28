export interface CoalescedReporter {
  readonly submit: (task: () => Promise<void>) => void
  readonly clearPending: () => void
  readonly pending: () => boolean
  readonly idle: () => Promise<void>
}

export function createCoalescedReporter(
  onFailure: (error: unknown) => void,
): CoalescedReporter {
  let queued: (() => Promise<void>) | null = null
  let running: Promise<void> | null = null

  const pump = () => {
    if (running || !queued) return
    const task = queued
    queued = null
    running = task()
      .catch(onFailure)
      .finally(() => {
        running = null
        pump()
      })
  }
  const idle = async (): Promise<void> => {
    if (!running && !queued) return
    await running
    await Promise.resolve()
    return idle()
  }

  return {
    submit(task) {
      queued = task
      pump()
    },
    clearPending() {
      queued = null
    },
    pending: () => Boolean(running || queued),
    idle,
  }
}
