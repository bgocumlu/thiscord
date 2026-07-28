export const searchKeys = {
  all: ['global_search'] as const,
  global: (query: string) => [...searchKeys.all, query] as const,
} as const
