export interface MessageComposerKeyIntent {
  readonly key: string
  readonly shiftKey: boolean
  readonly isComposing: boolean
  readonly multilineEnter: boolean
}

export function shouldSubmitMessageComposer({
  key,
  shiftKey,
  isComposing,
  multilineEnter,
}: MessageComposerKeyIntent) {
  return key === 'Enter' && !shiftKey && !isComposing && !multilineEnter
}
