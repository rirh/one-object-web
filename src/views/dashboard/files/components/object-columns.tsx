import type { ColumnDef } from "@tanstack/react-table"
import type { StorageObjectEntry } from "../api"
import { Checkbox } from "@/components/ui/checkbox"
import { TextLink } from "@/components/text-link"
import { FolderIcon } from "lucide-react"
import { NameTooltip } from "./name-tooltip"
import { FileIcon } from "./file-icon"
import { FileActions } from "./file-actions"
import { isImageFile, objectDownloadHref } from "../links"
import { bytes } from "@/lib/format"
import { formatModifiedTime } from "../format"
import type { Locale } from "@/local"
import type { useObjectTranslation } from "@/local/object"
const objectHref = (item: StorageObjectEntry) =>
  objectDownloadHref(item.storage_id, item.key)
export function objectColumns({
  tx,
  canDelete,
  selectedKeys,
  fileKeys,
  pending,
  onSelect,
  view,
  onOpenFolder,
  onPreview,
  now,
  locale,
}: {
  tx: ReturnType<typeof useObjectTranslation>
  canDelete: boolean
  selectedKeys: string[]
  fileKeys: string[]
  pending: boolean
  onSelect: (keys: string[]) => void
  view: "files" | "folders"
  onOpenFolder: (key: string) => void
  onPreview: (item: StorageObjectEntry, trigger: HTMLAnchorElement) => void
  now: Date
  locale: Locale
}): ColumnDef<StorageObjectEntry>[] {
  return [
    ...(canDelete
      ? [
          {
            id: "selection",
            header: () => (
              <Checkbox
                aria-label={tx("全选当前页文件")}
                disabled={!fileKeys.length || pending}
                checked={
                  selectedKeys.length > 0 &&
                  selectedKeys.length === fileKeys.length
                    ? true
                    : selectedKeys.length
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(checked) =>
                  onSelect(checked === true ? fileKeys : [])
                }
              />
            ),
            cell: ({ row }) =>
              row.original.kind === "file" ? (
                <Checkbox
                  aria-label={tx("选择 {0}", { 0: row.original.key })}
                  disabled={pending}
                  checked={selectedKeys.includes(row.original.key)}
                  onCheckedChange={(checked) =>
                    onSelect(
                      checked === true
                        ? [...selectedKeys, row.original.key]
                        : selectedKeys.filter(
                            (key) => key !== row.original.key,
                          ),
                    )
                  }
                />
              ) : null,
          } satisfies ColumnDef<StorageObjectEntry>,
        ]
      : []),
    {
      id: "name",
      header: tx("对象"),
      cell: ({ row }) => {
        const item = row.original
        const folder = item.kind === "folder"
        const label = view === "files" ? item.key : item.name
        return (
          <div className="flex min-w-0 items-center gap-2">
            {folder ? (
              <FolderIcon
                aria-hidden="true"
                className="size-4 shrink-0 text-primary"
              />
            ) : (
              <FileIcon name={item.name} href={objectHref(item)} />
            )}
            {folder ? (
              <button
                type="button"
                className="min-h-7 min-w-0 text-left text-primary hover:underline"
                onClick={() => onOpenFolder(item.key)}
              >
                <NameTooltip
                  name={item.key}
                  label={label.endsWith("/") ? label : `${label}/`}
                  focusable={false}
                />
              </button>
            ) : (
              <TextLink
                href={objectHref(item)}
                target={isImageFile(item.name) ? undefined : "_blank"}
                rel={isImageFile(item.name) ? undefined : "noopener noreferrer"}
                aria-haspopup={isImageFile(item.name) ? "dialog" : undefined}
                onClick={(event) => {
                  if (isImageFile(item.name)) {
                    event.preventDefault()
                    onPreview(item, event.currentTarget)
                  }
                }}
                tooltip={item.key}
              >
                <span className="block truncate">{label}</span>
              </TextLink>
            )}
          </div>
        )
      },
    },
    {
      id: "kind",
      header: tx("类型"),
      cell: ({ row }) =>
        row.original.kind === "folder" ? tx("文件夹") : tx("文件"),
    },
    {
      id: "size",
      header: tx("大小"),
      cell: ({ row }) =>
        row.original.size == null ? "—" : bytes(row.original.size),
    },
    {
      id: "modified",
      header: tx("修改时间"),
      cell: ({ row }) =>
        formatModifiedTime(row.original.modified_at, now, locale),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{tx("操作")}</span>,
      cell: ({ row }) =>
        row.original.kind === "file" ? (
          <FileActions
            name={row.original.key}
            href={objectHref(row.original)}
          />
        ) : null,
    },
  ]
}
