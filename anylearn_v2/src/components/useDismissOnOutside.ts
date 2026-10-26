import { useEffect, type RefObject } from 'react'

// Closes a popup when the person presses outside it (or hits Escape). A full-screen overlay cannot do this in the site
// header: its backdrop blur makes `fixed` children cover only the header, so clicks on the page never reached it.
export function useDismissOnOutside(ref: RefObject<HTMLElement | null>, active: boolean, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return
    const dismissOnOutsidePress = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onDismiss()
    }
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('pointerdown', dismissOnOutsidePress)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnOutsidePress)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [ref, active, onDismiss])
}
