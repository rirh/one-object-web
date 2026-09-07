import * as React from "react"
import { XIcon } from "lucide-react"

import { useTranslation } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

type ResponsiveDialogMode = "dialog" | "drawer"

const ResponsiveDialogContext =
  React.createContext<ResponsiveDialogMode>("dialog")

function useResponsiveDialogMode() {
  return React.useContext(ResponsiveDialogContext)
}

function ResponsiveDialog({
  children,
  ...props
}: React.ComponentProps<typeof Dialog> & React.ComponentProps<typeof Drawer>) {
  const isMobile = useIsMobile()
  const mode: ResponsiveDialogMode = isMobile ? "drawer" : "dialog"
  const Root = isMobile ? Drawer : Dialog

  return (
    <ResponsiveDialogContext.Provider value={mode}>
      <Root {...props}>{children}</Root>
    </ResponsiveDialogContext.Provider>
  )
}

function ResponsiveDialogTrigger(
  props: React.ComponentProps<typeof DialogTrigger> &
    React.ComponentProps<typeof DrawerTrigger>
) {
  const mode = useResponsiveDialogMode()
  return mode === "drawer" ? (
    <DrawerTrigger {...props} />
  ) : (
    <DialogTrigger {...props} />
  )
}

function ResponsiveDialogClose(
  props: React.ComponentProps<typeof DialogClose> &
    React.ComponentProps<typeof DrawerClose>
) {
  const mode = useResponsiveDialogMode()
  return mode === "drawer" ? (
    <DrawerClose {...props} />
  ) : (
    <DialogClose {...props} />
  )
}

function ResponsiveDialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogContent> & {
  showCloseButton?: boolean
}) {
  const mode = useResponsiveDialogMode()
  const { locale } = useTranslation()
  const closeLabel = locale === "zh-CN" ? "关闭" : "Close"

  if (mode === "drawer") {
    return (
      <DrawerContent
        className={cn(
          "max-h-[90svh] overflow-hidden p-0 data-[vaul-drawer-direction=bottom]:max-h-[90svh]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <DrawerClose asChild>
            <Button
              aria-label={closeLabel}
              className="absolute top-2 right-2"
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <XIcon />
            </Button>
          </DrawerClose>
        ) : null}
      </DrawerContent>
    )
  }

  return (
    <DialogContent
      className={cn("gap-0 overflow-hidden p-0", className)}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </DialogContent>
  )
}

function ResponsiveDialogHeader({
  className,
  ...props
}: React.ComponentProps<typeof DialogHeader>) {
  const mode = useResponsiveDialogMode()
  const Header = mode === "drawer" ? DrawerHeader : DialogHeader
  return (
    <Header
      className={cn(
        "shrink-0 gap-0.5 bg-muted/50 px-4 py-2 pr-12 text-left",
        className
      )}
      {...props}
    />
  )
}

function ResponsiveDialogBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const mode = useResponsiveDialogMode()
  return (
    <div
      className={cn(
        "min-h-0 p-4",
        mode === "drawer" && "flex-1 overflow-y-auto",
        className
      )}
      data-slot="responsive-dialog-body"
      {...props}
    />
  )
}

function ResponsiveDialogFooter({
  className,
  ...props
}: React.ComponentProps<typeof DialogFooter>) {
  const mode = useResponsiveDialogMode()
  return mode === "drawer" ? (
    <DrawerFooter className={cn("mt-auto bg-muted/50", className)} {...props} />
  ) : (
    <DialogFooter
      className={cn("mx-0 mb-0 shrink-0 bg-muted/50 px-4 py-2", className)}
      {...props}
    />
  )
}

function ResponsiveDialogTitle(
  props: React.ComponentProps<typeof DialogTitle> &
    React.ComponentProps<typeof DrawerTitle>
) {
  const mode = useResponsiveDialogMode()
  return mode === "drawer" ? (
    <DrawerTitle {...props} />
  ) : (
    <DialogTitle {...props} />
  )
}

function ResponsiveDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogDescription> &
  React.ComponentProps<typeof DrawerDescription>) {
  const mode = useResponsiveDialogMode()
  return mode === "drawer" ? (
    <DrawerDescription className={cn("text-xs", className)} {...props} />
  ) : (
    <DialogDescription className={cn("text-xs", className)} {...props} />
  )
}

export {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogTrigger,
}
