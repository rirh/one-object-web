import { useObjectTranslation } from "@/local/object"
import { Link } from "react-router"
import { UnderlineHover } from "@/components/underline-hover"
const example = `# Small files: one request, one cloud PUT (under 100,000,000 bytes).
# Keep OBJECT_TOKEN in the application server environment.
printf abc | curl -X POST \\\n  "$OBJECT_URL/api/files/upload?filename=hello.txt&mime_type=text%2Fplain" \\\n  -H "Authorization: Bearer $OBJECT_TOKEN" \\\n  -H 'Content-Type: application/octet-stream' --data-binary @-

# Read policy before selecting multipart for larger files.
curl "$OBJECT_URL/api/uploads/policy" \\\n  -H "Authorization: Bearer $OBJECT_TOKEN"`
export default function IntegrationPage() {
  const tx = useObjectTranslation()

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ol className="flex list-inside list-decimal flex-col gap-3 text-sm">
        <li>
          {tx("在")}{" "}
          <UnderlineHover asChild>
            <Link to="/dashboard/authorizations">{tx("授权管理")}</Link>
          </UnderlineHover>{" "}
          {tx("创建专用密钥，选择需要的权限。")}
        </li>
        <li>
          {tx(
            "把 Object 地址和密钥配置到应用后端，使用 Authorization: Bearer 鉴权。",
          )}
        </li>
        <li>
          {tx(
            "小于 100 MB 使用普通上传接口；达到 100 MB 后创建分片任务，按 part_size 上传并调用 complete。",
          )}
        </li>
        <li>
          {tx(
            "保存返回的 file_id。读取文件需要 files:read；删除需要 files:delete。",
          )}
        </li>
      </ol>
      <pre className="max-w-full overflow-x-auto rounded-md bg-muted p-4 text-xs leading-6">
        <code>{example}</code>
      </pre>
      <div className="flex flex-col gap-3 text-sm">
        <h2 className="font-medium">{tx("恢复与取消")}</h2>
        <p>
          <code>GET /api/uploads/:id</code>
          {tx("返回已确认的分片及 SHA-256。核对原文件后，只补传缺失分片。")}
        </p>
        <p>
          <code>POST /api/uploads/:id/abort</code>{" "}
          {tx(
            "取消未完成任务；普通上传重试会重传整文件，分片上传只需补传未确认分片。",
          )}
        </p>
        <p>
          <code>GET /api/files/:id/download</code>{" "}
          {tx(
            "鉴权后跳转到临时下载地址。接入端不要将 Bearer 密钥转发到跳转目标。",
          )}
        </p>
        <p>
          {tx(
            "浏览器前端通过自己的应用后端转发上传请求。长期应用密钥不能放入浏览器代码。",
          )}
        </p>
      </div>
    </div>
  )
}
