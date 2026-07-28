export function needsReadReceipt(
  lastMessageId: string,
  serverLastMessageId: string,
  submittedLastMessageId: string,
) {
  return Boolean(
    lastMessageId
    && lastMessageId !== serverLastMessageId
    && lastMessageId !== submittedLastMessageId,
  )
}

export interface ReadReceiptCoordinator {
  readonly pending: () => string
  readonly begin: (latestMessageId: string, persistedMessageId: string) => boolean
  readonly failed: (messageId: string) => void
}

export function createReadReceiptCoordinator(): ReadReceiptCoordinator {
  let submittedLastMessageId = ''
  return {
    pending: () => submittedLastMessageId,
    begin(lastMessageId, serverLastMessageId) {
      if (!needsReadReceipt(lastMessageId, serverLastMessageId, submittedLastMessageId)) return false
      submittedLastMessageId = lastMessageId
      return true
    },
    failed(messageId) {
      if (submittedLastMessageId === messageId) submittedLastMessageId = ''
    },
  }
}
