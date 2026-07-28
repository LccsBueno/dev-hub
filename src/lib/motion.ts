import { useCallback, useRef } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'

export function animatePanelOpen(panel: HTMLElement, backdrop: HTMLElement): void {
  gsap.killTweensOf([panel, backdrop])
  gsap.to(backdrop, { opacity: 1, duration: 0.2, ease: 'power2.out' })
  gsap.to(panel, { x: 0, opacity: 1, duration: 0.35, ease: 'power3.out' })
}

export function animatePanelClose(panel: HTMLElement, backdrop: HTMLElement): void {
  gsap.killTweensOf([panel, backdrop])
  gsap.to(panel, { x: '100%', opacity: 0, duration: 0.25, ease: 'power2.in' })
  gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: 'power2.in' })
}

export function animateTabContent(el: HTMLElement): void {
  gsap.killTweensOf(el)
  gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' })
}

export function usePressAnimation<T extends HTMLElement>(): {
  ref: RefObject<T | null>
  onPointerDown: () => void
  onPointerUp: () => void
  onPointerLeave: () => void
} {
  const ref = useRef<T>(null)

  const onPointerDown = useCallback(() => {
    if (!ref.current) return
    gsap.killTweensOf(ref.current)
    gsap.to(ref.current, { scale: 0.94, duration: 0.1, ease: 'power1.in' })
  }, [])

  const onPointerUp = useCallback(() => {
    if (!ref.current) return
    gsap.killTweensOf(ref.current)
    gsap.to(ref.current, { scale: 1, duration: 0.25, ease: 'power3.out' })
  }, [])

  return { ref, onPointerDown, onPointerUp, onPointerLeave: onPointerUp }
}
