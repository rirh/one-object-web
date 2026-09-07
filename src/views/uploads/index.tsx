import { useEffect, useRef } from "react"
import { useAtom } from "jotai"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { PauseIcon, UploadIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field"
import { Progress } from "@/components/ui/progress"
import { SweepShine } from "@/components/sweep-shine"
import { Loading, Failure, NoItems } from "@/components/async-state"
import { bytes, date } from "@/lib/format"
import { abortUpload, listUploads, uploadFile } from "./api"
import { progressAtom } from "./store"
export default function UploadsPage() {
  const [progress, setProgress] = useAtom(progressAtom)
  const controller = useRef<AbortController | null>(null)
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ["uploads"],
    queryFn: ({ signal }) => listUploads(signal),
  })
  useEffect(
    () => () => {
      controller.current?.abort()
      setProgress(null)
    },
    [setProgress],
  )
  const upload = useMutation({
    mutationFn: async ({ file, id }: { file: File; id?: string }) => {
      setProgress(null)
      const current = new AbortController()
      controller.current = current
      return uploadFile(file, id, current.signal, (id, percent) =>
        setProgress({ id, percent }),
      )
    },
    onSuccess: () => {
      toast.success("文件上传完成")
      void client.invalidateQueries({ queryKey: ["files"] })
    },
    onError: (error) => {
      if (controller.current?.signal.aborted)
        toast.info("上传已暂停，可重新选择原文件继续")
      else toast.error(error.message)
    },
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ["uploads"] })
    },
  })
  const abort = useMutation({
    mutationFn: abortUpload,
    onSuccess: (result) => {
      toast.success(
        result.status === "completed"
          ? "文件已合并，可在文件列表管理"
          : "上传已取消",
      )
      void client.invalidateQueries({ queryKey: ["uploads"] })
      void client.invalidateQueries({ queryKey: ["files"] })
    },
    onError: (error) => toast.error(error.message),
  })
  const busy = upload.isPending || abort.isPending
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">上传文件</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          支持大文件分片、暂停和失败续传。上传任务保留 24 小时。
        </p>
      </div>
      <Field className="max-w-xl">
        <FieldLabel htmlFor="new-file">
          <UploadIcon className="size-4" />
          选择文件
        </FieldLabel>
        <Input
          id="new-file"
          type="file"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) upload.mutate({ file })
            event.target.value = ""
          }}
        />
        <FieldDescription>
          选择后开始上传，每个分片 16 MiB。空文件暂不支持。
        </FieldDescription>
      </Field>
      {upload.isPending && !progress ? (
        <p role="status">
          <SweepShine>正在创建上传任务…</SweepShine>
        </p>
      ) : null}
      {progress ? (
        <div className="flex max-w-xl flex-col gap-3" aria-live="polite">
          <div className="flex items-center justify-between text-sm">
            <span>
              <SweepShine active={upload.isPending}>
                {upload.isPending
                  ? progress.percent === 99
                    ? "正在合并文件"
                    : "正在上传"
                  : progress.percent === 100
                    ? "上传完成"
                    : "已停止，可继续上传"}
              </SweepShine>
            </span>
            <span>{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} />
          {upload.isPending ? (
            <Button
              className="self-start"
              variant="outline"
              onClick={() => controller.current?.abort()}
            >
              <PauseIcon data-icon="inline-start" />
              暂停
            </Button>
          ) : null}
        </div>
      ) : null}
      {upload.error && !controller.current?.signal.aborted ? (
        <Failure error={upload.error} />
      ) : null}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">未完成的上传</h2>
        <Button
          variant="outline"
          disabled={query.isFetching}
          aria-busy={query.isFetching}
          onClick={() => void query.refetch()}
        >
          <SweepShine active={query.isFetching}>刷新</SweepShine>
        </Button>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data.items.length ? (
        <ul className="divide-y rounded-md border">
          {query.data.items.map((item) => (
            <li
              className="flex flex-wrap items-center justify-between gap-4 p-4"
              key={item.id}
            >
              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-medium"
                  title={item.original_filename}
                >
                  {item.original_filename}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {bytes(item.file_size)} · {item.total_parts} 个分片 ·{" "}
                  {date(item.expires_at)} 到期
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <Field className="w-52">
                  <FieldLabel htmlFor={`resume-${item.id}`}>
                    选择原文件继续
                  </FieldLabel>
                  <Input
                    id={`resume-${item.id}`}
                    type="file"
                    disabled={busy || item.expires_at * 1000 <= Date.now()}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) upload.mutate({ file, id: item.id })
                      event.target.value = ""
                    }}
                  />
                </Field>
                <Button
                  variant="outline"
                  disabled={busy}
                  aria-busy={abort.isPending}
                  onClick={() => abort.mutate(item.id)}
                >
                  <SweepShine
                    active={abort.isPending && abort.variables === item.id}
                  >
                    取消上传
                  </SweepShine>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <NoItems
          title="没有未完成的上传"
          description="上传中断后，可以在这里选择原文件继续。"
        />
      )}
    </div>
  )
}
