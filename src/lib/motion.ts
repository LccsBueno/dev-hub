import { useCallback, useRef } from 'react'
import type { RefObject } from 'react'
import gsap from 'gsap'

export function animateTabContent(el: HTMLElement): void {
  gsap.killTweensOf(el)
  gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' })
}

export function animateDetailPanelEnter(panel: HTMLElement): void {
  gsap.killTweensOf(panel)
  gsap.fromTo(panel, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'sine.inOut' })
}

export function animateDetailPanelExit(panel: HTMLElement, onComplete: () => void): void {
  gsap.killTweensOf(panel)
  gsap.to(panel, { opacity: 0, duration: 0.25, ease: 'sine.inOut', onComplete })
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

export function useHoverLift<T extends HTMLElement>(liftPx = 3): {
  ref: RefObject<T | null>
  onPointerEnter: () => void
  onPointerLeave: () => void
} {
  const ref = useRef<T>(null)

  const onPointerEnter = useCallback(() => {
    if (!ref.current) return
    gsap.killTweensOf(ref.current)
    gsap.to(ref.current, { y: -liftPx, duration: 0.22, ease: 'power2.out' })
  }, [liftPx])

  const onPointerLeave = useCallback(() => {
    if (!ref.current) return
    gsap.killTweensOf(ref.current)
    gsap.to(ref.current, { y: 0, duration: 0.28, ease: 'power2.out' })
  }, [])

  return { ref, onPointerEnter, onPointerLeave }
}

export function animateToastEnter(el: HTMLElement): void {
  gsap.fromTo(el, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.25, ease: 'power2.out' })
}

export function animateToastExit(el: HTMLElement, onComplete: () => void): void {
  gsap.to(el, { opacity: 0, x: 16, duration: 0.2, ease: 'power1.in', onComplete })
}

export function animateViewSwitch(el: HTMLElement): void {
  gsap.killTweensOf(el)
  gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' })
}

export function animateInfoGridEnter(container: HTMLElement): void {
  const cards = Array.from(container.children)
  gsap.killTweensOf(cards)
  gsap.fromTo(
    cards,
    { opacity: 0, scale: 0.97 },
    { opacity: 1, scale: 1, duration: 0.25, stagger: 0.035, ease: 'power2.out' }
  )
}

export function animateStarPop(el: HTMLElement): void {
  gsap.killTweensOf(el)
  gsap.fromTo(el, { scale: 1 }, { scale: 1.3, duration: 0.12, ease: 'power2.out', yoyo: true, repeat: 1 })
}
