/* eslint-disable react-refresh/only-export-components */
import type { User } from '@thiscord/shared'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { RecordModel } from 'pocketbase'
import { usePocketBase } from '../lib/contexts'
import { getOwnPreferences } from '../features/members/preferences'

interface RegisterInput {
  readonly email: string
  readonly handle: string
  readonly displayName: string
  readonly password: string
}

interface AuthContextValue {
  readonly user: User | null
  readonly ready: boolean
  readonly login: (identity: string, password: string) => Promise<void>
  readonly register: (input: RegisterInput) => Promise<void>
  readonly logout: () => void
  readonly requestPasswordReset: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toUser(record: RecordModel | null): User | null {
  return record ? record as unknown as User : null
}

export function AuthProvider({ children }: { readonly children: ReactNode }) {
  const client = usePocketBase()
  const [user, setUser] = useState<User | null>(() => toUser(client.authStore.record))

  useEffect(() => {
    let generation = 0
    return client.authStore.onChange((_token, record) => {
      const currentGeneration = ++generation
      const baseUser = toUser(record)
      setUser(baseUser)
      if (!baseUser) return
      void getOwnPreferences(client).then((preferences) => {
        if (generation !== currentGeneration) return
        setUser({ ...baseUser, preferences })
      }).catch(() => {
        // Authentication remains usable if the private preference request is transiently unavailable.
      })
    }, true)
  }, [client])

  const login = useCallback(async (identity: string, password: string) => {
    await client.collection('users').authWithPassword(identity.trim(), password)
  }, [client])

  const register = useCallback(async (input: RegisterInput) => {
    await client.collection('users').create({
      email: input.email.trim().toLowerCase(),
      emailVisibility: false,
      handle: input.handle.trim().toLowerCase(),
      displayName: input.displayName.trim(),
      password: input.password,
      passwordConfirm: input.password,
    })
    await client.collection('users').requestVerification(input.email.trim().toLowerCase())
    await client.collection('users').authWithPassword(input.email.trim().toLowerCase(), input.password)
  }, [client])

  const logout = useCallback(() => client.authStore.clear(), [client])
  const requestPasswordReset = useCallback(async (email: string) => {
    await client.collection('users').requestPasswordReset(email.trim().toLowerCase())
  }, [client])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    ready: true,
    login,
    register,
    logout,
    requestPasswordReset,
  }), [user, login, register, logout, requestPasswordReset])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('AuthProvider is missing.')
  return value
}
