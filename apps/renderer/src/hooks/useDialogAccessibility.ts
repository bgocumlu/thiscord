import { useEffect, useRef, type RefObject } from 'react'

export function useDialogAccessibility(
  dialogRef: RefObject<HTMLDialogElement | null>,
  onClose: () => void,
) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    const onCancel = (event: Event) => {
      event.preventDefault()
      closeRef.current()
    }
    const onMouseDown = (event: MouseEvent) => {
      if (event.target === dialog) closeRef.current()
    }
    dialog.addEventListener('cancel', onCancel)
    dialog.addEventListener('mousedown', onMouseDown)
    return () => {
      dialog.removeEventListener('cancel', onCancel)
      dialog.removeEventListener('mousedown', onMouseDown)
      if (dialog.open) dialog.close()
      previousFocus?.focus()
    }
  }, [dialogRef])
}
