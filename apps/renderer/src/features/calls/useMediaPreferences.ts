import { useCallback, useRef, useState } from 'react'

export function useMediaPreferences() {
  const [microphoneMuted, setMicrophoneMuted] = useState(
    () => localStorage.getItem('thiscord_voice_muted') === 'true',
  )
  const microphoneMutedRef = useRef(microphoneMuted)
  const [deafenedValue, setDeafenedValue] = useState(
    () => localStorage.getItem('thiscord_voice_deafened') === 'true',
  )
  const deafenedRef = useRef(deafenedValue)

  const rememberMuted = useCallback((muted: boolean) => {
    microphoneMutedRef.current = muted
    setMicrophoneMuted(muted)
    localStorage.setItem('thiscord_voice_muted', String(muted))
  }, [])

  const rememberDeafened = useCallback((nextDeafened: boolean) => {
    setDeafenedValue(nextDeafened)
    deafenedRef.current = nextDeafened
    localStorage.setItem('thiscord_voice_deafened', String(nextDeafened))
  }, [])

  return {
    preferredMicrophoneMuted: microphoneMuted,
    preferredDeafened: deafenedValue,
    microphoneMutedRef,
    deafenedRef,
    rememberMuted,
    rememberDeafened,
  }
}
