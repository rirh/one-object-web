import { useObjectTranslation } from "@/local/object"
import { DialogActionButton } from "@/components/ui/dialog-action-button"
import {
  ResponsiveDialog,
  ResponsiveDialogClose,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog"
import type { AppKey } from "./api"

export function KeyRevokeDialog({
  keyToRevoke,
  pending,
  onConfirm,
  onOpenChange,
}: {
  keyToRevoke: AppKey | null
  pending: boolean
  onConfirm: () => void
  onOpenChange: (open: boolean) => void
}) {
  const tx = useObjectTranslation()
  return (
    <ResponsiveDialog
      open={keyToRevoke !== null}
      onOpenChange={onOpenChange}
    >
      <ResponsiveDialogContent className="sm:max-w-md" showCloseButton={!pending}>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{tx("撤销授权")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {tx("撤销后该应用将立即停止访问，且不能恢复。")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <div className="px-4 py-3 text-sm font-medium">
          {keyToRevoke?.name}
        </div>
        <ResponsiveDialogFooter>
          <ResponsiveDialogClose asChild>
            <DialogActionButton
              action="cancel"
              type="button"
              variant="outline"
              disabled={pending}
            >
              {tx("取消")}
            </DialogActionButton>
          </ResponsiveDialogClose>
          <DialogActionButton
            variant="destructive"
            disabled={!keyToRevoke || pending}
            loading={pending}
            loadingText={tx("撤销中…")}
            onClick={onConfirm}
          >
            {tx("确认撤销")}
          </DialogActionButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
