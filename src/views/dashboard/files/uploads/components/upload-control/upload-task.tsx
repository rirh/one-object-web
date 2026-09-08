import { useObjectTranslation } from "@/local/object"

import { useCurrentTime } from "@/hooks/use-current-time"

import { PauseIcon, PlayIcon, XIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { Input } from "@/components/ui/input"

import { UploadProgress } from "../upload-progress"

import { NameTooltip } from "@/views/dashboard/files/components/name-tooltip"

import { type Entry } from "../../store/queue"
export function UploadTask({
  entry,
  clearing,
  cancelling,
  update,
  onPause,
  cancel,
}: {
  entry: Entry
  clearing: boolean
  cancelling: string | null
  update: (key: string, patch: Partial<Entry>) => void
  onPause: () => void
  cancel: (entry: Entry) => Promise<void>
}) {
  const tx = useObjectTranslation()
  const now = useCurrentTime()
  return (
    <li className="flex items-center gap-1.5 py-1.5" key={entry.key}>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <NameTooltip name={entry.name} className="flex-1" />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {entry.status === "uploading"
              ? `${entry.percent}%`
              : tx(entry.status === "error" ? "上传失败" : entry.label)}
          </span>
        </div>
        {entry.status === "error" && (
          <p className="text-xs text-destructive break-words">
            {tx(entry.label)}
          </p>
        )}
        {entry.status === "uploading" && !entry.single && (
          <UploadProgress
            value={entry.percent}
            active
            label={tx(entry.label)}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {["uploading", "queued"].includes(entry.status) ? (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={tx("暂停 {0}", { 0: entry.name })}
            onClick={() =>
              entry.status === "queued"
                ? update(entry.key, {
                    status: "paused",
                    label: "已暂停",
                  })
                : onPause()
            }
          >
            <PauseIcon />
          </Button>
        ) : null}
        {["paused", "error"].includes(entry.status) &&
          (entry.file ? (
            <Button
              size="icon-sm"
              variant="ghost"
              disabled={clearing}
              aria-label={tx(entry.single ? "重新上传 {0}" : "继续 {0}", {
                0: entry.name,
              })}
              onClick={() =>
                update(entry.key, {
                  status: "queued",
                  label: "等待上传",
                })
              }
            >
              <PlayIcon />
            </Button>
          ) : (
            <Button size="sm" variant="ghost" asChild>
              <label className="cursor-pointer">
                {entry.expiresAt && entry.expiresAt * 1000 <= now.getTime()
                  ? tx("已过期")
                  : tx("选原文件")}
                <Input
                  type="file"
                  className="sr-only"
                  aria-label={tx("选择原文件继续 {0}", {
                    0: entry.name,
                  })}
                  disabled={
                    clearing ||
                    (!!entry.expiresAt &&
                      entry.expiresAt * 1000 <= now.getTime())
                  }
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file)
                      update(entry.key, {
                        file,
                        status: "queued",
                        label: "等待上传",
                      })
                    event.target.value = ""
                  }}
                />
              </label>
            </Button>
          ))}
        {entry.status !== "uploading" && (
          <Button
            size="icon-sm"
            variant="ghost"
            aria-label={tx("取消 {0}", { 0: entry.name })}
            disabled={clearing || cancelling !== null}
            onClick={() => void cancel(entry)}
          >
            <XIcon />
          </Button>
        )}
      </div>
    </li>
  )
}
