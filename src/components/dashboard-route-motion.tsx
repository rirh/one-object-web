import { gsap } from "gsap"
import { useLayoutEffect, useRef, type ReactNode } from "react"

export function DashboardPageTransition({
  children,
  routeKey,
}: {
  children: ReactNode
  routeKey: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    gsap.killTweensOf(container)

    if (prefersReducedMotion()) {
      gsap.set(container, { autoAlpha: 1, clearProps: "transform" })
      return
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        container,
        { autoAlpha: 0.5, y: 7 },
        {
          autoAlpha: 1,
          clearProps: "transform,opacity,visibility",
          duration: 0.24,
          ease: "power2.out",
          y: 0,
        }
      )
    }, container)

    return () => context.revert()
  }, [routeKey])

  return (
    <div
      ref={containerRef}
      className="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto will-change-transform"
    >
      {children}
    </div>
  )
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}
