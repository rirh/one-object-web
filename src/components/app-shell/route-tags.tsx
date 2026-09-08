import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react"

import { useEffect, useLayoutEffect, useRef } from "react"

import { useTranslation } from "@/components/providers/language-context"

import { cn } from "@/lib/utils"

import { type NavigationItem } from "./navigation"
export function RouteTags({
  activeItem,
  items,
  onClose,
  onSelect,
}: {
  activeItem: NavigationItem | null
  items: ReadonlyArray<NavigationItem>
  onClose: (item: NavigationItem) => void
  onSelect: (item: NavigationItem) => void
}) {
  const { locale } = useTranslation()
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const isFirstItemActive = items[0]?.id === activeItem?.id

  useEffect(() => {
    const activeElement = scrollRef.current?.querySelector<HTMLElement>(
      '[data-active-tag="true"]',
    )
    activeElement?.scrollIntoView({ block: "nearest", inline: "center" })
  }, [activeItem?.id, items])

  useLayoutEffect(() => {
    const root = rootRef.current
    const scroll = scrollRef.current
    if (!root || !scroll) {
      return
    }

    let animationFrame = 0
    const updateOverflow = () => {
      window.cancelAnimationFrame(animationFrame)
      animationFrame = window.requestAnimationFrame(() => {
        root.dataset.overflow =
          scroll.scrollWidth > scroll.clientWidth + 1 ? "true" : "false"
      })
    }

    updateOverflow()
    window.addEventListener("resize", updateOverflow)
    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateOverflow)
    resizeObserver?.observe(scroll)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener("resize", updateOverflow)
      resizeObserver?.disconnect()
    }
  }, [items])

  function scrollBy(offset: number) {
    scrollRef.current?.scrollBy({ left: offset, behavior: "smooth" })
  }

  return (
    <div ref={rootRef} className="tags-view-chrome min-w-0 flex-1">
      <button
        type="button"
        className="tags-view-chrome__nav tags-view-chrome__nav--left"
        aria-label={locale === "zh-CN" ? "向左滚动" : "Scroll left"}
        onClick={() => scrollBy(-240)}
      >
        <ChevronLeftIcon />
      </button>
      <div ref={scrollRef} className="tags-view-chrome__wrapper">
        <div
          className={cn(
            "tags-view-chrome__list",
            isFirstItemActive && "is-first-active",
          )}
        >
          {items.map((item, index) => {
            const Icon = item.icon
            const active = activeItem?.id === item.id
            const closable = item.id !== "home"
            const label = item.label
            const previousItem = items[index - 1]
            const separated =
              index > 0 && !active && previousItem?.id !== activeItem?.id

            return (
              <div
                className={cn(
                  "tags-view-chrome__item",
                  active && "active",
                  closable && "is-closable",
                  separated && "is-separated",
                )}
                data-active-tag={active}
                key={item.id}
              >
                <button
                  aria-current={active ? "page" : undefined}
                  className="tags-view-chrome__label"
                  onClick={() => onSelect(item)}
                  type="button"
                >
                  <span className="tags-view-chrome__icon">
                    <Icon aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </button>
                {closable ? (
                  <button
                    aria-label={
                      locale === "zh-CN" ? `关闭${label}` : `Close ${label}`
                    }
                    className="tags-view-chrome__close"
                    onClick={() => onClose(item)}
                    tabIndex={-1}
                    type="button"
                  >
                    <XIcon aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        className="tags-view-chrome__nav tags-view-chrome__nav--right"
        aria-label={locale === "zh-CN" ? "向右滚动" : "Scroll right"}
        onClick={() => scrollBy(240)}
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}
