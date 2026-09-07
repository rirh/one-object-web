import * as React from "react"

import { SweepShine } from "@/components/sweep-shine"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"

type DialogActionKind = "confirm" | "cancel"
type DialogActionTone = DialogActionKind | "destructive"
type ShortcutKind = DialogActionKind | "none"

type DialogActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children"
> & {
  action?: DialogActionKind
  children: React.ReactNode
  loading?: boolean
  loadingText?: React.ReactNode
  shortcut?: ShortcutKind
}

function DialogActionButton({
  action = "confirm",
  children,
  disabled,
  loading,
  loadingText,
  ref,
  shortcut = action,
  variant,
  ...props
}: DialogActionButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  const composedRef = useComposedButtonRef(buttonRef, ref)

  useDialogActionShortcut({
    buttonRef,
    disabled: disabled || loading,
    shortcut,
  })

  return (
    <Button
      aria-busy={loading || undefined}
      data-dialog-shortcut={shortcut === "none" ? undefined : shortcut}
      disabled={disabled || loading}
      variant={variant ?? (action === "cancel" ? "outline" : "default")}
      {...props}
      ref={composedRef}
    >
      <DialogActionButtonContent
        loading={loading}
        loadingText={loadingText}
        shortcut={shortcut}
        tone={variant === "destructive" ? "destructive" : action}
      >
        {children}
      </DialogActionButtonContent>
    </Button>
  )
}

function DialogActionButtonContent({
  children,
  loading,
  loadingText,
  shortcut,
  tone,
}: {
  children: React.ReactNode
  loading?: boolean
  loadingText?: React.ReactNode
  shortcut: ShortcutKind
  tone: DialogActionTone
}) {
  return (
    <>
      {loading ? <SweepShine>{loadingText || children}</SweepShine> : children}
      <DialogShortcutHint tone={tone} shortcut={shortcut} />
    </>
  )
}

function DialogShortcutHint({
  tone,
  shortcut,
}: {
  tone: DialogActionTone
  shortcut: ShortcutKind
}) {
  const keys = shortcutKeys(shortcut)
  if (!keys.length) return null

  return (
    <KbdGroup className="ml-0.5">
      {keys.map((key) => (
        <Kbd key={key} className={shortcutToneClassName(tone)}>
          {key}
        </Kbd>
      ))}
    </KbdGroup>
  )
}

function shortcutToneClassName(tone: DialogActionTone) {
  if (tone === "destructive") {
    return "bg-destructive/15 text-destructive"
  }
  if (tone === "confirm") {
    return "bg-primary-foreground/20 text-primary-foreground"
  }
  return "bg-muted-foreground/15 text-foreground"
}

function shortcutKeys(shortcut: ShortcutKind) {
  if (shortcut === "confirm") return ["⌘", "↵"]
  if (shortcut === "cancel") return ["Esc"]
  return []
}

function useComposedButtonRef(
  buttonRef: React.MutableRefObject<HTMLButtonElement | null>,
  forwardedRef: React.Ref<HTMLButtonElement> | undefined
) {
  return React.useCallback(
    (node: HTMLButtonElement | null) => {
      buttonRef.current = node
      setRef(forwardedRef, node)
    },
    [buttonRef, forwardedRef]
  )
}

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
  if (!ref) return
  if (typeof ref === "function") {
    ref(value)
    return
  }
  ref.current = value
}

function useDialogActionShortcut({
  buttonRef,
  disabled,
  shortcut,
}: {
  buttonRef: React.RefObject<HTMLButtonElement | null>
  disabled?: boolean
  shortcut: ShortcutKind
}) {
  React.useEffect(() => {
    if (shortcut === "none") return

    const activeShortcut: DialogActionKind = shortcut
    const ownerDocument = buttonRef.current?.ownerDocument ?? document
    const ownerWindow = ownerDocument.defaultView
    if (!ownerWindow) return

    function handleKeyDown(event: KeyboardEvent) {
      const button = buttonRef.current
      if (
        disabled ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        !button ||
        !matchesShortcut(event, activeShortcut) ||
        !isElementActionable(button)
      ) {
        return
      }

      const topLayer = getTopDialogLayer(ownerDocument)
      if (topLayer && !topLayer.contains(button)) return
      if (
        getActiveShortcutButton(ownerDocument, activeShortcut, topLayer) !==
        button
      ) {
        return
      }

      event.preventDefault()
      button.click()
    }

    ownerWindow.addEventListener("keydown", handleKeyDown)
    return () => ownerWindow.removeEventListener("keydown", handleKeyDown)
  }, [buttonRef, disabled, shortcut])
}

function matchesShortcut(event: KeyboardEvent, shortcut: DialogActionKind) {
  if (shortcut === "confirm") {
    return (event.metaKey || event.ctrlKey) && event.key === "Enter"
  }
  return (
    event.key === "Escape" &&
    !event.altKey &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey
  )
}

function getActiveShortcutButton(
  ownerDocument: Document,
  shortcut: DialogActionKind,
  topLayer: Element | null
) {
  const buttons = Array.from(
    ownerDocument.querySelectorAll<HTMLButtonElement>(
      `[data-dialog-shortcut="${shortcut}"]`
    )
  ).filter(isElementActionable)
  const scopedButtons = topLayer
    ? buttons.filter((button) => topLayer.contains(button))
    : buttons
  return scopedButtons.at(-1) ?? null
}

function getTopDialogLayer(ownerDocument: Document) {
  const layers = Array.from(
    ownerDocument.querySelectorAll<HTMLElement>(
      [
        "[data-slot='alert-dialog-content']",
        "[data-slot='dialog-content']",
        "[data-slot='drawer-content']",
      ].join(",")
    )
  ).filter(isElementVisible)
  return layers.at(-1) ?? null
}

function isElementActionable(element: HTMLButtonElement) {
  return (
    !element.disabled &&
    element.getAttribute("aria-disabled") !== "true" &&
    isElementVisible(element)
  )
}

function isElementVisible(element: Element) {
  if (!element.isConnected || element.getClientRects().length === 0) {
    return false
  }
  const style = element.ownerDocument.defaultView?.getComputedStyle(element)
  return style?.visibility !== "hidden" && style?.display !== "none"
}

export { DialogActionButton, DialogShortcutHint }
