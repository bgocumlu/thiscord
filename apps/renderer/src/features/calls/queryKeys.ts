export const callKeys = {
  all: ['call_occupancy'] as const,
  occupancy: (targets: string) => [...callKeys.all, targets] as const,
} as const
