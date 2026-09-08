import { gsap } from "gsap"
import { useLayoutEffect, useRef, type ReactNode } from "react"

export function DashboardPageTransition({
  children,
  routeKey,
  animateOnMount = true,
  variant = "slide",
}: {
  children: ReactNode
  routeKey: string
  animateOnMount?: boolean
  variant?: "slide" | "fade"
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousRouteKey = useRef(routeKey)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const routeChanged = previousRouteKey.current !== routeKey
    previousRouteKey.current = routeKey
    if (!animateOnMount && !routeChanged) return

    gsap.killTweensOf(container)

    if (prefersReducedMotion()) {
      gsap.set(container, { autoAlpha: 1, clearProps: "transform" })
      return
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        container,
        variant === "fade" ? { autoAlpha: 0.85 } : { autoAlpha: 0.5, y: 7 },
        {
          autoAlpha: 1,
          clearProps: "transform,opacity,visibility",
          duration: variant === "fade" ? 0.14 : 0.24,
          ease: "power2.out",
          ...(variant === "slide" ? { y: 0 } : {}),
        },
      )
    }, container)

    return () => context.revert()
  }, [routeKey, animateOnMount, variant])

  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto ${variant === "fade" ? "will-change-[opacity]" : "will-change-transform"}`}
    >
      {children}
    </div>
  )
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
