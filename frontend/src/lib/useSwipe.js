import { useRef } from 'react'

// Detecta swipe horizontal por touch. onSwipeLeft = deslizó hacia la izquierda (avanza).
export function useSwipe(onSwipeLeft, onSwipeRight, threshold = 40) {
  const startX = useRef(null)

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
  }
  function onTouchEnd(e) {
    if (startX.current === null) return
    const deltaX = e.changedTouches[0].clientX - startX.current
    if (deltaX < -threshold) onSwipeLeft?.()
    else if (deltaX > threshold) onSwipeRight?.()
    startX.current = null
  }

  return { onTouchStart, onTouchEnd }
}
