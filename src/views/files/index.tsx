import { useCallback } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useSearchParams } from "react-router"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { UploadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { Loading, Failure, NoItems } from "@/components/async-state"
import { FileTable } from "./components/file-table"
import { deleteFile, listFiles, type ObjectFile } from "./api"
import { SweepShine } from "@/components/sweep-shine"
export default function FilesPage() {
  const [params, setParams] = useSearchParams()
  const offset = Math.max(
    0,
    Math.min(1_000_000, Number(params.get("offset")) || 0),
  )
  const search = params.get("search") || ""
  const form = useForm({ values: { search } })
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ["files", offset, search],
    queryFn: ({ signal }) => listFiles(offset, search, signal),
  })
  const remove = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      toast.success("文件已删除")
      void client.invalidateQueries({ queryKey: ["files"] })
    },
    onError: (error) => toast.error(error.message),
  })
  const onDelete = useCallback(
    (file: ObjectFile) => {
      if (window.confirm(`删除“${file.original_filename}”？此操作无法撤销。`))
        remove.mutate(file.id)
    },
    [remove.mutate],
  )
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">文件管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            集中管理后台与应用上传的文件。
          </p>
        </div>
        <Button asChild>
          <Link to="/uploads">
            <UploadIcon data-icon="inline-start" />
            上传文件
          </Link>
        </Button>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={form.handleSubmit(({ search }) =>
          setParams({ search, offset: "0" }),
        )}
      >
        <Field className="max-w-sm">
          <FieldLabel htmlFor="file-search">搜索文件</FieldLabel>
          <Input
            id="file-search"
            placeholder="输入文件名"
            maxLength={200}
            {...form.register("search")}
          />
        </Field>
        <Button
          variant="outline"
          type="submit"
          disabled={query.isFetching}
          aria-busy={query.isFetching}
        >
          <SweepShine active={query.isFetching}>搜索</SweepShine>
        </Button>
      </form>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : query.data.items.length ? (
        <FileTable
          data={query.data.items}
          onDelete={onDelete}
          pending={remove.isPending}
        />
      ) : (
        <NoItems title="暂无文件" description="上传文件后，会在这里显示。" />
      )}
      {remove.isPending ? (
        <p role="status">
          <SweepShine>正在删除文件…</SweepShine>
        </p>
      ) : null}
      {query.data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            共 {query.data.total} 个文件
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={offset === 0 || query.isFetching}
              onClick={() =>
                setParams({ search, offset: String(Math.max(0, offset - 50)) })
              }
            >
              上一页
            </Button>
            <Button
              variant="outline"
              disabled={offset + 50 >= query.data.total || query.isFetching}
              onClick={() => setParams({ search, offset: String(offset + 50) })}
            >
              下一页
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
