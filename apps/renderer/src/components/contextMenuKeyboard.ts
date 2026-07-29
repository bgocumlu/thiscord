export function contextDialogTabTarget(
  currentIndex: number,
  controlCount: number,
  backwards: boolean,
) {
  const nextIndex = currentIndex + (backwards ? -1 : 1)
  return nextIndex < 0 || nextIndex >= controlCount ? null : nextIndex
}
