import { MoonIcon, SunIcon } from "lucide-react"
import { type MouseEvent } from "react"

import { useTranslation } from "@/components/providers/language-context"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"

type ThemeName = "light" | "dark"

type ViewTransition = {
  ready: Promise<void>
}

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => Promise<void> | void) => ViewTransition
}

const THEME_TOGGLE_VIEW_TRANSITION_CSS = `
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
    mix-blend-mode: normal;
  }

  ::view-transition-old(root) {
    z-index: 1;
  }

  ::view-transition-new(root) {
    z-index: 2147483646;
  }

  .dark::view-transition-old(root) {
    z-index: 2147483646;
  }

  .dark::view-transition-new(root) {
    z-index: 1;
  }
`

function getDomTheme(): ThemeName {
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

function applyThemeToRoot(theme: ThemeName) {
  const root = document.documentElement
  root.classList.remove("light", "dark")
  root.classList.add(theme)
  root.style.colorScheme = theme
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()
  const label = t("theme.switch")

  function updateTheme(nextTheme: ThemeName) {
    applyThemeToRoot(nextTheme)
    setTheme(nextTheme)
  }

  function handleToggle(event: MouseEvent<HTMLButtonElement>) {
    const currentTheme =
      resolvedTheme === "light" || resolvedTheme === "dark"
        ? resolvedTheme
        : getDomTheme()
    const nextTheme: ThemeName = currentTheme === "dark" ? "light" : "dark"
    const transitionDocument = document as DocumentWithViewTransition
    const supportsTransition =
      typeof transitionDocument.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (!supportsTransition) {
      updateTheme(nextTheme)
      return
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )
    const ratioX = (100 * x) / window.innerWidth
    const ratioY = (100 * y) / window.innerHeight
    const referenceRadius =
      Math.hypot(window.innerWidth, window.innerHeight) / Math.SQRT2
    const ratioRadius = (100 * endRadius) / referenceRadius

    const transition = transitionDocument.startViewTransition(() => {
      updateTheme(nextTheme)
    })

    void transition.ready
      .then(() => {
        const clipPath = [
          `circle(0% at ${ratioX}% ${ratioY}%)`,
          `circle(${ratioRadius}% at ${ratioX}% ${ratioY}%)`,
        ]

        document.documentElement.animate(
          {
            clipPath: nextTheme === "dark" ? [...clipPath].reverse() : clipPath,
          },
          {
            duration: 400,
            easing: "ease-in",
            fill: "both",
            pseudoElement:
              nextTheme === "dark"
                ? "::view-transition-old(root)"
                : "::view-transition-new(root)",
          }
        )
      })
      .catch(() => undefined)
  }

  return (
    <>
      <style>{THEME_TOGGLE_VIEW_TRANSITION_CSS}</style>
      <Button
        aria-label={label}
        className="shrink-0"
        onClick={handleToggle}
        size="icon-sm"
        title={label}
        type="button"
        variant="outline"
      >
        <MoonIcon aria-hidden="true" strokeWidth={2} className="dark:hidden" />
        <SunIcon
          aria-hidden="true"
          strokeWidth={2}
          className="hidden dark:block"
        />
      </Button>
    </>
  )
}
