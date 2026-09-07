import { listConnections } from "@/views/storage/api"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { MIN_PAGE_SIZE } from "@/lib/pagination"
import { PageHeader } from "@/components/page-header"
import { authPermissionsQuery } from "@/views/account/permissions-api"
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
  const storageId = params.get("storage") || ""
  const connections = useQuery({
    queryKey: ["storage-connections"],
    queryFn: ({ signal }) => listConnections(signal),
  })
  const form = useForm({ values: { search } })
  const access = useQuery(authPermissionsQuery)
  const client = useQueryClient()
  const query = useQuery({
    queryKey: ["files", offset, search, storageId],
    queryFn: ({ signal }) => listFiles(offset, search, signal, storageId),
  })
  const remove = useMutation({
    mutationFn: deleteFile,
    onSuccess: () => {
      toast.success("文件已删除")
      void client.invalidateQueries({ queryKey: ["files"] })
    },
    onError: (error) => toast.error(error.message),
  })
  const removeFile = remove.mutate
  const onDelete = useCallback(
    (file: ObjectFile) => {
      if (window.confirm(`删除“${file.original_filename}”？此操作无法撤销。`))
        removeFile(file.id)
    },
    [removeFile],
  )
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader
          eyebrow="对象存储"
          title="文件管理"
          description="集中管理后台与应用上传的文件。"
        />
        <Button asChild>
          <Link
            to={
              storageId
                ? `/dashboard/uploads?storage=${encodeURIComponent(storageId)}`
                : "/dashboard/uploads"
            }
          >
            <UploadIcon data-icon="inline-start" />
            上传文件
          </Link>
        </Button>
      </div>
      <div className="max-w-sm">
        <Select
          value={storageId || "all"}
          onValueChange={(value) =>
            setParams({
              search,
              storage: value === "all" ? "" : value,
              offset: "0",
            })
          }
        >
          <SelectTrigger aria-label="筛选存储接入">
            <SelectValue placeholder="全部存储" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部存储</SelectItem>
            {connections.data?.items.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name} · {c.bucket}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={form.handleSubmit(({ search }) =>
          setParams({ search, storage: storageId, offset: "0" }),
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
          onDelete={
            access.data?.permissions.includes("object:files:delete")
              ? onDelete
              : undefined
          }
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
      {query.data && query.data.total >= MIN_PAGE_SIZE ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-muted-foreground">
            共 {query.data.total} 个文件
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={offset === 0 || query.isFetching}
              onClick={() =>
                setParams({
                  search,
                  storage: storageId,
                  offset: String(Math.max(0, offset - 50)),
                })
              }
            >
              上一页
            </Button>
            <Button
              variant="outline"
              disabled={offset + 50 >= query.data.total || query.isFetching}
              onClick={() =>
                setParams({
                  search,
                  storage: storageId,
                  offset: String(offset + 50),
                })
              }
            >
              下一页
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
