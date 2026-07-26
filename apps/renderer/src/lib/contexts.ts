import type { DistributionConfig } from '@thiscord/shared'
import { createContext, useContext } from 'react'
import type PocketBase from 'pocketbase'

export const RuntimeContext = createContext<DistributionConfig | null>(null)
export const PocketBaseContext = createContext<PocketBase | null>(null)

export function useRuntimeConfig() {
  const config = useContext(RuntimeContext)
  if (!config) throw new Error('Runtime configuration is unavailable.')
  return config
}

export function usePocketBase() {
  const client = useContext(PocketBaseContext)
  if (!client) throw new Error('PocketBase is unavailable.')
  return client
}
