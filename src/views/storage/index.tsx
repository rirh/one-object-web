import { useQuery } from "@tanstack/react-query"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Loading, Failure } from "@/components/async-state"
import { Badge } from "@/components/ui/badge"
import { bytes } from "@/lib/format"
import { getStorage } from "./api"
export default function StoragePage() {
  const query = useQuery({
    queryKey: ["storage"],
    queryFn: ({ signal }) => getStorage(signal),
  })
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">存储配置</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          所有应用通过 One Object 写入统一的 S3 兼容存储。
        </p>
      </div>
      {query.isPending ? (
        <Loading />
      ) : query.error ? (
        <Failure error={query.error} retry={() => void query.refetch()} />
      ) : (
        <>
          <Badge className="self-start" variant="secondary">
            {query.data.configured ? "已配置（连接未检测）" : "待配置"}
          </Badge>
          {!query.data.configured ? (
            <Alert>
              <AlertTitle>尚未配置存储连接</AlertTitle>
              <AlertDescription>
                请在后端环境配置中填写
                S3_ENDPOINT、S3_REGION、S3_BUCKET、S3_ACCESS_KEY_ID、S3_SECRET_ACCESS_KEY，重启后即可上传。凭证只保存在服务端。
              </AlertDescription>
            </Alert>
          ) : null}
          <dl className="grid max-w-2xl grid-cols-[auto_minmax(0,1fr)] gap-x-8 gap-y-4 text-sm">
            <dt className="text-muted-foreground">Bucket</dt>
            <dd className="break-all">{query.data.bucket || "—"}</dd>
            <dt className="text-muted-foreground">Region</dt>
            <dd>{query.data.region || "—"}</dd>
            <dt className="text-muted-foreground">分片大小</dt>
            <dd>{bytes(query.data.part_size)}</dd>
            <dt className="text-muted-foreground">单文件上限</dt>
            <dd>{bytes(query.data.max_file_size)}</dd>
            <dt className="text-muted-foreground">下载方式</dt>
            <dd>鉴权后生成 60 秒有效的下载地址</dd>
          </dl>
        </>
      )}
    </div>
  )
}
