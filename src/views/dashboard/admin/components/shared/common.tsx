import { useObjectTranslation } from "@/local/object"
import { CircleAlertIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { LoadingState } from "@/components/loading-state"
import { HttpError } from "@/lib/request"
export function AdminErrorAlert({ error }: { error: unknown }) {
  const tx = useObjectTranslation()

  const details =
    error instanceof HttpError
      ? (error.details as { message?: string } | null)
      : null
  return (
    <Alert variant="destructive">
      <CircleAlertIcon />
      <AlertTitle>{tx("操作未完成")}</AlertTitle>
      <AlertDescription>
        {details?.message ||
          (error instanceof Error ? tx(error.message) : tx("请求失败，请重试"))}
      </AlertDescription>
    </Alert>
  )
}
export function AdminLoading() {
  const tx = useObjectTranslation()

  return <LoadingState>{tx("加载中")}</LoadingState>
}
