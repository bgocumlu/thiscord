export const CONTEXT_MENU_LONG_PRESS_MS = 500
const CONTEXT_MENU_LONG_PRESS_MOVE_PX = 10

interface Point {
  readonly x: number
  readonly y: number
}

export function contextMenuLongPressMoved(
  start: Point,
  current: Point,
  threshold = CONTEXT_MENU_LONG_PRESS_MOVE_PX,
) {
  return Math.abs(current.x - start.x) > threshold
    || Math.abs(current.y - start.y) > threshold
}
