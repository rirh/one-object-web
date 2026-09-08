import { useObjectTranslation } from "@/local/object"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/loading-state"
import { ApiError } from "@/lib/http"
export function Loading() {
  const tx = useObjectTranslation()

  return <LoadingState>{tx("正在加载…")}</LoadingState>
}
export function Failure({
  error,
  retry,
}: {
  error: Error
  retry?: () => void
}) {
  const tx = useObjectTranslation()

  return (
    <Alert variant="destructive">
      <AlertTitle>{tx("请求未完成")}</AlertTitle>
      <AlertDescription>
        {tx(error.message)}
        {error instanceof ApiError && error.status === 401 ? (
          <Button asChild variant="outline">
            <a href="/api/auth/oidc/start">{tx("重新登录")}</a>
          </Button>
        ) : retry ? (
          <Button variant="outline" onClick={retry}>
            {tx("重试")}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  )
}
export function NoItems({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
