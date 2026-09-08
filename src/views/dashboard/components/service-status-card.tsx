import type { UseQueryResult } from "@tanstack/react-query"

import { useTranslation } from "@/components/providers/language-context"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { MessageKey } from "@/local"
import type { ServiceStatus } from "@/views/dashboard/api"

type ServiceStatusCardProps = {
  descriptionKey: MessageKey
  query: UseQueryResult<ServiceStatus, Error>
  titleKey: MessageKey
}

export function ServiceStatusCard({
  descriptionKey,
  query,
  titleKey,
}: ServiceStatusCardProps) {
  const { t } = useTranslation()
  const checking = query.isPending || query.isFetching
  const status = checking
    ? t("status.checking")
    : query.isSuccess
      ? t("status.available")
      : t("status.unavailable")

  return (
    <div className="flex min-h-12 items-center justify-between gap-4 rounded-lg bg-card px-3.5 py-2.5 shadow-none">
      <h3 className="truncate text-sm font-medium">{t(titleKey)}</h3>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={`${t(titleKey)}: ${status}`}
            className={cn(
              "group relative flex size-7 shrink-0 cursor-default items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring",
              query.isError && "cursor-pointer",
            )}
            onClick={() => {
              if (query.isError) void query.refetch()
            }}
            type="button"
          >
            <StatusDot pending={checking} success={query.isSuccess} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          align="end"
          className="flex max-w-72 flex-col items-start gap-1.5"
          side="left"
          sideOffset={4}
        >
          <div className="flex w-full items-center justify-between gap-4">
            <span className="font-medium">{t(titleKey)}</span>
            <span className="text-background/70">{status}</span>
          </div>
          <p className="text-background/75">{t(descriptionKey)}</p>
          {query.data?.service ? (
            <p>
              <span className="text-background/60">{t("status.service")} </span>
              <span className="font-mono">{query.data.service}</span>
            </p>
          ) : null}
          {query.data?.version ? (
            <p>
              <span className="text-background/60">{t("status.version")} </span>
              <span className="font-mono">{query.data.version}</span>
            </p>
          ) : null}
          {query.isError ? (
            <>
              <p className="break-words text-red-300">{query.error.message}</p>
              <p className="text-background/60">{t("status.retry")}</p>
            </>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

function StatusDot({
  pending,
  success,
}: {
  pending: boolean
  success: boolean
}) {
  const color = pending
    ? "bg-amber-500"
    : success
      ? "bg-emerald-500"
      : "bg-red-500"

  return (
    <span className="relative flex size-2.5">
      {success && !pending ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
      ) : null}
      <span
        className={cn(
          "relative inline-flex size-2.5 rounded-full",
          color,
          pending && "animate-pulse motion-reduce:animate-none",
        )}
      />
    </span>
  )
}
