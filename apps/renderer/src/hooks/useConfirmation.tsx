import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ConfirmDialog } from '../components/WorkspacePrimitives'

interface ConfirmationOptions {
  readonly title: string
  readonly description: ReactNode
  readonly confirmLabel: string
}

interface PendingConfirmation extends ConfirmationOptions {
  readonly resolve: (confirmed: boolean) => void
}

export function useConfirmation() {
  const [pending, setPending] = useState<PendingConfirmation | null>(null)
  const pendingRef = useRef<PendingConfirmation | null>(null)

  const close = useCallback((confirmed: boolean) => {
    const current = pendingRef.current
    pendingRef.current = null
    setPending(null)
    current?.resolve(confirmed)
  }, [])

  const confirm = useCallback((options: ConfirmationOptions) => (
    new Promise<boolean>((resolve) => {
      pendingRef.current?.resolve(false)
      const request = { ...options, resolve }
      pendingRef.current = request
      setPending(request)
    })
  ), [])

  useEffect(() => () => {
    pendingRef.current?.resolve(false)
    pendingRef.current = null
  }, [])

  const confirmation = pending ? (
    <ConfirmDialog
      title={pending.title}
      description={pending.description}
      confirmLabel={pending.confirmLabel}
      onClose={() => close(false)}
      onConfirm={() => close(true)}
    />
  ) : null

  return { confirm, confirmation }
}
