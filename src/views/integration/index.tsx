import { Link } from "react-router"
import { UnderlineHover } from "@/components/underline-hover"
const example = `# 从应用服务端发起请求。OBJECT_TOKEN 放在服务端环境变量中。
curl "$OBJECT_URL/api/uploads" \\
  -H "Authorization: Bearer $OBJECT_TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{"original_filename":"hello.txt","file_size":3,"mime_type":"text/plain"}'

# 从上一步响应的 upload.id 取得 UPLOAD_ID
printf abc | curl -X PUT \\
  "$OBJECT_URL/api/uploads/$UPLOAD_ID/parts/1" \\
  -H "Authorization: Bearer $OBJECT_TOKEN" \\
  -H 'Content-Type: application/octet-stream' --data-binary @-

curl -X POST "$OBJECT_URL/api/uploads/$UPLOAD_ID/complete" \\
  -H "Authorization: Bearer $OBJECT_TOKEN"`
export default function IntegrationPage() {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">应用接入</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          其他应用调用同一套分片接口，无需直接管理存储凭证。
        </p>
      </div>
      <ol className="flex list-inside list-decimal flex-col gap-3 text-sm">
        <li>
          在{" "}
          <UnderlineHover asChild>
            <Link to="/keys">应用密钥</Link>
          </UnderlineHover>{" "}
          创建专用密钥，选择需要的权限。
        </li>
        <li>
          把 Object 地址和密钥配置到应用后端，使用 Authorization: Bearer 鉴权。
        </li>
        <li>
          创建上传任务，按返回的 part_size 切片，从 1 开始上传，最后调用
          complete。
        </li>
        <li>
          保存返回的 file_id。读取文件需要 files:read；删除需要 files:delete。
        </li>
      </ol>
      <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6">
        <code>{example}</code>
      </pre>
      <div className="flex flex-col gap-3 text-sm">
        <h2 className="font-medium">恢复与取消</h2>
        <p>
          <code>GET /api/uploads/:id</code> 返回已确认的分片及
          SHA-256。核对原文件后，只补传缺失分片。
        </p>
        <p>
          <code>POST /api/uploads/:id/abort</code>{" "}
          取消任务。分片重复提交相同内容、合并重试均可安全恢复。
        </p>
        <p>
          <code>GET /api/files/:id/download</code>{" "}
          鉴权后跳转到临时下载地址。接入端不要将 Bearer 密钥转发到跳转目标。
        </p>
        <p>
          浏览器前端通过自己的应用后端转发上传请求。长期应用密钥不能放入浏览器代码。
        </p>
      </div>
    </div>
  )
}
