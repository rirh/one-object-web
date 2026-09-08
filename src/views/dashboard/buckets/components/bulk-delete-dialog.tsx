import { DialogActionButton } from "@/components/ui/dialog-action-button"
import { useObjectTranslation } from "@/local/object"

import { SweepShine } from "@/components/sweep-shine"

import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"

import { type Bucket } from "../api"

export function BucketBulkDeleteDialog({
  buckets,
  deleting,
  onConfirm,
  onOpenChange,
}: {
  buckets: Bucket[] | null
  deleting: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  const tx = useObjectTranslation()

  return (
    <ResponsiveDialog open={buckets !== null} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{tx("批量删除云端桶")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {tx("确定删除选中的")}
            {buckets?.length ?? 0}{" "}
            {tx(
              "个云端桶吗？仅支持空桶；存在文件、历史版本或未完成分片时会拒绝删除。",
            )}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {buckets?.map((bucket) => (
              <li key={bucket.id} className="truncate" title={bucket.bucket}>
                {bucket.bucket}
              </li>
            ))}
          </ul>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            type="button"
            variant="outline"
            disabled={deleting}
            onClick={() => onOpenChange(false)}
          >
            {tx("取消")}
          </DialogActionButton>
          <DialogActionButton
            variant="destructive"
            disabled={deleting}
            onClick={onConfirm}
          >
            <SweepShine active={deleting}>{tx("确认删除")}</SweepShine>
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
