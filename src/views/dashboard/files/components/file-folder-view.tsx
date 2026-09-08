import { useObjectTranslation } from "@/local/object"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { NameTooltip } from "./name-tooltip"
import { ChevronRightIcon, FolderOpenIcon } from "lucide-react"

import { NoItems } from "@/components/async-state"
import { cn } from "@/lib/utils"
import { PROVIDERS, type StorageConnection } from "@/views/dashboard/storage/api"

type FileFolderViewProps = {
  connections: StorageConnection[]
  selectedStorageId: string
  showBucketName: boolean
  total?: number
  onOpenStorage: (id: string) => void
}

export function FileFolderView({
  connections,
  selectedStorageId,
  total,
  onOpenStorage,
}: FileFolderViewProps) {
  const tx = useObjectTranslation()

  const [page, setPage] = useState(0)
  const visibleConnections = selectedStorageId
    ? connections.filter((connection) => connection.id === selectedStorageId)
    : connections

  const pages = Math.max(1, Math.ceil(visibleConnections.length / 12))
  const currentPage = Math.min(page, pages - 1)
  if (!visibleConnections.length) {
    return (
      <NoItems
        title={tx("暂无存储目录")}
        description={tx("请先配置厂商接入，再从目录视图浏览文件。")}
      />
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-medium">{tx("存储目录")}</h2>
        <span className="text-xs text-muted-foreground">
          {visibleConnections.length}
          {tx("个存储桶")}
        </span>
      </div>
      <div className="overflow-hidden bg-background">
        {visibleConnections
          .slice(currentPage * 12, (currentPage + 1) * 12)
          .map((connection) => {
            const selected = connection.id === selectedStorageId
            return (
              <button
                className={cn(
                  "group flex h-11 md:h-9 w-full items-center gap-2 border-b px-3 text-left transition-colors last:border-b-0 hover:bg-muted/50",
                  selected && "border-primary/50 bg-accent/50",
                  !connection.enabled && "opacity-60",
                )}
                key={connection.id}
                type="button"
                onClick={() => onOpenStorage(connection.id)}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <FolderOpenIcon aria-hidden="true" className="size-4" />
                </span>
                <img
                  src={`/storage-providers/${connection.provider}.svg`}
                  alt=""
                  aria-hidden="true"
                  className="size-5 shrink-0 object-contain"
                />
                <NameTooltip
                  className="flex-1 text-sm"
                  name={`${connection.bucket} · ${tx(PROVIDERS[connection.provider])}`}
                  label={connection.bucket}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  {selected && total !== undefined
                    ? tx("{0} 个文件", { 0: total })
                    : ""}
                </span>
                <ChevronRightIcon
                  aria-hidden="true"
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                />
                {!connection.enabled && (
                  <span className="sr-only">{tx("已停用")}</span>
                )}
              </button>
            )
          })}
      </div>
      <div className="mt-auto flex items-center justify-between border-t pt-2 text-xs">
        <span>
          {currentPage + 1} / {pages}
          {tx("页")}
        </span>
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={!currentPage}
            onClick={() => setPage(currentPage - 1)}
          >
            {tx("上一页")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={currentPage + 1 >= pages}
            onClick={() => setPage(currentPage + 1)}
          >
            {tx("下一页")}
          </Button>
        </div>
      </div>
    </div>
  )
}
