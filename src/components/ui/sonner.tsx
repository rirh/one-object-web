import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

import { useTheme } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const closeButtonClassName =
  "!left-auto !right-2 !top-2 !size-6 !transform-none !rounded-md !border-transparent !bg-transparent !text-inherit !opacity-60 !shadow-none transition hover:!bg-black/5 hover:!opacity-100 focus-visible:!outline-none focus-visible:!ring-2 focus-visible:!ring-current/20 dark:hover:!bg-white/10 [&>svg]:!size-3.5"

function Toaster({ toastOptions, ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme()
  const toastClassNames = toastOptions?.classNames

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        error: <OctagonXIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
        success: <CircleCheckIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        closeButtonAriaLabel: toastOptions?.closeButtonAriaLabel ?? "Close",
        classNames: {
          ...toastClassNames,
          closeButton: cn(closeButtonClassName, toastClassNames?.closeButton),
          toast: cn("cn-toast !pr-10", toastClassNames?.toast),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
