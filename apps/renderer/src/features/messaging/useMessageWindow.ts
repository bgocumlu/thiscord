import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { messageWindowRange } from './messagePresentation'

const defaultWindowSize = 400

export function useMessageWindow<TMessage extends { readonly id: string }>(
  messages: readonly TMessage[],
  highlightedMessageId: string,
  windowSize = defaultWindowSize,
) {
  const windowStep = windowSize / 2
  const [windowEndMessageId, setWindowEndMessageId] = useState('')
  const pendingOlderAnchor = useRef('')
  const requestedEnd = windowEndMessageId
    ? messages.findIndex((message) => message.id === windowEndMessageId) + 1
    : messages.length
  const storedWindow = messageWindowRange(messages.length, requestedEnd, windowSize)
  const highlightedIndex = highlightedMessageId
    ? messages.findIndex((message) => message.id === highlightedMessageId)
    : -1
  const highlightedWindowEnd = highlightedIndex >= 0
    && (
      highlightedIndex < storedWindow.start
      || highlightedIndex >= storedWindow.end
    )
    ? Math.min(
        messages.length,
        Math.max(windowSize, highlightedIndex + windowStep),
      )
    : storedWindow.end
  const range = messageWindowRange(messages.length, highlightedWindowEnd, windowSize)
  const renderedMessages = useMemo(
    () => messages.slice(range.start, range.end),
    [messages, range.end, range.start],
  )
  const renderedMessageIds = useMemo(
    () => renderedMessages.map((message) => message.id),
    [renderedMessages],
  )

  useEffect(() => {
    const anchorId = pendingOlderAnchor.current
    if (!anchorId) return
    const anchorIndex = messages.findIndex((message) => message.id === anchorId)
    if (anchorIndex <= 0) return
    pendingOlderAnchor.current = ''
    const nextEnd = Math.min(messages.length, anchorIndex + windowStep)
    setWindowEndMessageId(
      nextEnd < messages.length ? messages[nextEnd - 1]?.id ?? '' : '',
    )
  }, [messages, windowStep])

  return {
    renderedMessages,
    renderedMessageIds,
    hasOlderLoaded: range.start > 0,
    hasNewer: range.end < messages.length,
    expectOlderMessages() {
      pendingOlderAnchor.current = renderedMessages[0]?.id ?? ''
    },
    showOlder() {
      const nextEnd = Math.max(windowSize, range.end - windowStep)
      setWindowEndMessageId(messages[nextEnd - 1]?.id ?? '')
    },
    showNewer() {
      const nextEnd = Math.min(messages.length, range.end + windowStep)
      setWindowEndMessageId(
        nextEnd < messages.length ? messages[nextEnd - 1]?.id ?? '' : '',
      )
    },
  }
}
