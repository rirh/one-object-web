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

export function BucketDisableDialog({
  bucket,
  pending,
  error,
  onClose,
  onConfirm,
}: {
  bucket: Bucket | null
  pending: boolean
  error: Error | null
  onClose: () => void
  onConfirm: (bucket: Bucket) => void
}) {
  const tx = useObjectTranslation()
  return (
    <ResponsiveDialog
      open={bucket !== null}
      onOpenChange={(open) => {
        if (!open && !pending) {
          onClose()
        }
      }}
    >
      <ResponsiveDialogContent
        className="sm:max-w-md"
        showCloseButton={!pending}
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{tx("停用接入")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {tx("停用后，此桶不能用于新上传；已有文件和未完成上传仍保留。")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody className="flex flex-col gap-3">
          <p className="break-all text-sm font-medium">{bucket?.bucket}</p>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {tx(error.message)}
            </p>
          )}
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <DialogActionButton
            action="cancel"
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              onClose()
            }}
          >
            {tx("取消")}
          </DialogActionButton>
          <DialogActionButton
            variant="destructive"
            disabled={!bucket || pending}
            aria-busy={pending}
            onClick={() => {
              if (bucket) onConfirm(bucket)
            }}
          >
            <SweepShine active={pending}>{tx("确认停用")}</SweepShine>
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
