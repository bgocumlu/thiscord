interface OrderedMessage {
  readonly id: string
  readonly created: string
}

export function mergeFocusedMessage<TMessage extends OrderedMessage>(
  history: readonly TMessage[],
  focused: TMessage | undefined,
) {
  if (!focused || history.some((message) => message.id === focused.id)) return history
  return [...history, focused].sort((left, right) => (
    new Date(left.created).getTime() - new Date(right.created).getTime()
  ))
}

export function shouldShowEmptyMessageState(
  visibleMessageCount: number,
  pendingOrFailed: readonly boolean[],
) {
  return visibleMessageCount === 0 && !pendingOrFailed.some(Boolean)
}

export function messageWindowRange(
  messageCount: number,
  requestedEnd: number,
  windowSize: number,
) {
  const end = requestedEnd > 0 && requestedEnd <= messageCount
    ? requestedEnd
    : messageCount
  return {
    start: Math.max(0, end - windowSize),
    end,
  }
}
