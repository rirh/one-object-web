import { DialogActionButton } from "@/components/ui/dialog-action-button"
import { DialogClose, DialogFooter } from "@/components/ui/dialog"
import { useMemo } from "react"
import { atom, useAtom } from "jotai"
import { DownloadIcon, XIcon } from "lucide-react"
import { useObjectTranslation } from "@/local/object"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/loading-state"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { NameTooltip } from "./name-tooltip"
import { objectDownloadHref } from "../links"
import type { StorageObjectEntry } from "../api"

export function ImagePreviewDialog({
  item,
  onClose,
  onRestoreFocus,
}: {
  item: StorageObjectEntry
  onClose: () => void
  onRestoreFocus: () => void
}) {
  const tx = useObjectTranslation()
  const stateAtom = useMemo(
    () => atom<"loading" | "loaded" | "error">("loading"),
    [],
  )
  const [state, setState] = useAtom(stateAtom)
  const href = objectDownloadHref(item.storage_id, item.key)
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="dark top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-background p-0 text-foreground ring-0 sm:max-w-none data-open:zoom-in-100 data-closed:zoom-out-100"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onRestoreFocus()
        }}
      >
        <DialogDescription className="sr-only">
          {tx("图片预览")}
        </DialogDescription>
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-auto px-2 pt-[max(4rem,env(safe-area-inset-top))] pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-4">
          {state === "error" ? (
            <div
              role="alert"
              className="flex flex-col items-center gap-3 text-sm text-muted-foreground"
            >
              <p>{tx("此图片暂时无法预览，请重试或下载查看。")}</p>
              <Button variant="outline" onClick={() => setState("loading")}>
                {tx("重试")}
              </Button>
            </div>
          ) : (
            <>
              {state === "loading" && (
                <LoadingState>{tx("正在加载图片…")}</LoadingState>
              )}
              <img
                src={href}
                alt={item.name}
                className={
                  state === "loading"
                    ? "absolute size-px opacity-0"
                    : "h-full w-full object-contain"
                }
                onLoad={() => setState("loaded")}
                onError={() => setState("error")}
              />
            </>
          )}
        </div>
        <header className="absolute inset-x-0 top-0 flex min-w-0 items-center gap-3 bg-gradient-to-b from-background/95 to-transparent px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
          <DialogTitle className="min-w-0 flex-1 text-sm font-medium">
            <NameTooltip name={item.key} label={item.name} focusable={false} />
          </DialogTitle>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label={tx("下载")}
            title={tx("下载")}
          >
            <a href={href}>
              <DownloadIcon />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-10"
            aria-label={tx("关闭")}
            title={tx("关闭")}
            onClick={onClose}
          >
            <XIcon />
          </Button>
        </header>
        <DialogFooter>
          <DialogClose asChild>
            <DialogActionButton action="cancel" type="button">
              关闭
            </DialogActionButton>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
