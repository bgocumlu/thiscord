export function includeRouteTarget<T extends { readonly id: string }>(
  items: readonly T[],
  target: T | null | undefined,
) {
  if (!target || items.some((item) => item.id === target.id)) return [...items]
  return [...items, target]
}
