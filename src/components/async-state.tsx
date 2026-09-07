import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"
import { SweepShine } from "@/components/sweep-shine"
import { ApiError } from "@/lib/http"
export function Loading() {
  return (
    <p role="status" className="py-10 text-sm text-muted-foreground">
      <SweepShine>正在加载…</SweepShine>
    </p>
  )
}
export function Failure({
  error,
  retry,
}: {
  error: Error
  retry?: () => void
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>请求未完成</AlertTitle>
      <AlertDescription>
        {error.message}
        {error instanceof ApiError && error.status === 401 ? (
          <Button asChild variant="outline">
            <a href="/api/auth/oidc/start">重新登录</a>
          </Button>
        ) : retry ? (
          <Button variant="outline" onClick={retry}>
            重试
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
