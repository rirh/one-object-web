export type Endpoint = {
  id: string
  title: string
  method: string
  path: string
  scope: string
  description: string
  parameters: [string, string, string][]
  example: string
  response: string
}

const bearer = '-H "Authorization: Bearer $OBJECT_TOKEN"'
export const endpoints: Endpoint[] = [
  {
    id: "upload",
    title: "上传文件",
    method: "POST",
    path: "/api/files/upload",
    scope: "uploads:write",
    description:
      "普通上传接收原始文件字节，不使用 multipart/form-data。支持 1 字节至小于 100,000,000 字节的文件。",
    parameters: [
      ["filename", "Query · 必填", "原始文件名，需 URL 编码"],
      ["mime_type", "Query · 可选", "文件 MIME 类型"],
      [
        "storage_id",
        "Query · 可选",
        "存储接入 ID；省略时按授权范围和服务默认配置选择",
      ],
      ["body", "Body · 必填", "application/octet-stream 原始字节"],
    ],
    example: `curl --fail-with-body -X POST "$OBJECT_URL/api/files/upload?filename=hello.txt&mime_type=text%2Fplain" \\\n  ${bearer} \\\n  -H "Content-Type: application/octet-stream" --data-binary @./hello.txt`,
    response: '{"file_id":"FILE_ID","completed":true}',
  },
  {
    id: "files",
    title: "列出文件",
    method: "GET",
    path: "/api/files",
    scope: "files:read",
    description: "仅列出当前应用授权范围内的文件，每页最多 50 条。",
    parameters: [
      ["offset", "Query · 可选", "分页偏移量，默认 0"],
      ["search", "Query · 可选", "搜索关键词，需 URL 编码"],
    ],
    example: `curl --fail-with-body "$OBJECT_URL/api/files?offset=0" ${bearer}`,
    response: '{"items":[],"total":0,"limit":50}',
  },
  {
    id: "access",
    title: "获取下载地址",
    method: "GET",
    path: "/api/files/{file_id}/access",
    scope: "files:read",
    description:
      "返回 60 秒有效的预签名下载地址。下载该地址时不要附带 Object Token。业务记录保存 file_id，不保存临时 URL。",
    parameters: [["file_id", "Path · 必填", "上传返回的文件 ID"]],
    example: `curl --fail-with-body "$OBJECT_URL/api/files/$FILE_ID/access" ${bearer}`,
    response:
      '{"url":"https://storage.example/signed-download","expires_in":60}',
  },
  {
    id: "download",
    title: "下载重定向",
    method: "GET",
    path: "/api/files/{file_id}/download",
    scope: "files:read",
    description:
      "返回 307 重定向和 Location。推荐使用上面的 access 接口取得地址，再发起不携带 Token 的下载请求。",
    parameters: [["file_id", "Path · 必填", "文件 ID"]],
    example: `curl --fail-with-body -D - -o /dev/null "$OBJECT_URL/api/files/$FILE_ID/download" ${bearer}`,
    response:
      "HTTP/1.1 307 Temporary Redirect\nLocation: https://storage.example/signed-download",
  },
  {
    id: "delete",
    title: "删除文件",
    method: "DELETE",
    path: "/api/files/{file_id}",
    scope: "files:delete",
    description:
      "删除当前应用的文件。调用应用应先核验用户的业务权限和文件归属。",
    parameters: [["file_id", "Path · 必填", "要删除的文件 ID"]],
    example: `curl --fail-with-body -X DELETE "$OBJECT_URL/api/files/$FILE_ID" ${bearer}`,
    response: "HTTP/1.1 204 No Content",
  },
  {
    id: "policy",
    title: "读取上传策略",
    method: "GET",
    path: "/api/uploads/policy",
    scope: "uploads:write",
    description:
      "大文件上传前读取限制。使用响应中的 default_part_size 切片，不在客户端固定分片大小。",
    parameters: [],
    example: `curl --fail-with-body "$OBJECT_URL/api/uploads/policy" ${bearer}`,
    response:
      '{"min_part_size":5242880,"max_part_size":16777216,"max_single_file_size":99999999,"multipart_threshold":100000000,"default_part_size":16777216,"max_parts":10000,"max_file_size":167772160000}',
  },
  {
    id: "create-upload",
    title: "创建上传任务",
    method: "POST",
    path: "/api/uploads",
    scope: "uploads:write",
    description:
      "创建大文件任务，保存返回的 upload.id 和 upload.part_size。任务有效期 24 小时。响应示例仅展示关键字段。",
    parameters: [
      ["original_filename", "JSON · 必填", "原始文件名"],
      ["file_size", "JSON · 必填", "总字节数"],
      ["mime_type", "JSON · 可选", "MIME 类型"],
      [
        "storage_id",
        "JSON · 可选",
        "存储接入 ID；文件夹使用授权配置，不接受应用端 prefix",
      ],
      ["part_size", "JSON · 可选", "使用策略接口返回的分片大小"],
    ],
    example: `curl --fail-with-body -X POST "$OBJECT_URL/api/uploads" ${bearer} \\\n  -H "Content-Type: application/json" \\\n  -d '{"original_filename":"backup.zip","file_size":134217728,"part_size":16777216}'`,
    response:
      '{"upload":{"id":"UPLOAD_ID","part_size":16777216,"total_parts":8,"status":"initiated"},"parts":[]}',
  },
  {
    id: "part",
    title: "上传分片",
    method: "PUT",
    path: "/api/uploads/{id}/parts/{number}",
    scope: "uploads:write",
    description:
      "分片编号从 1 开始。除末片外长度必须等于 upload.part_size；重传同一片时内容必须一致。",
    parameters: [
      ["id", "Path · 必填", "上传任务 ID"],
      ["number", "Path · 必填", "分片编号，从 1 开始"],
      ["body", "Body · 必填", "该分片的原始字节"],
    ],
    example: `curl --fail-with-body -X PUT "$OBJECT_URL/api/uploads/$UPLOAD_ID/parts/1" ${bearer} \\\n  -H "Content-Type: application/octet-stream" --data-binary @./part-1`,
    response:
      '{"part":{"part_number":1,"etag":"…","sha256":"…","size":16777216}}',
  },
  {
    id: "resume",
    title: "查询任务 / 断点续传",
    method: "GET",
    path: "/api/uploads/{id}",
    scope: "uploads:write",
    description:
      "查询已确认分片，仅补传缺失的分片。若 upload.status 为 completed，任务已完成。",
    parameters: [["id", "Path · 必填", "上传任务 ID"]],
    example: `curl --fail-with-body "$OBJECT_URL/api/uploads/$UPLOAD_ID" ${bearer}`,
    response: '{"upload":{"id":"UPLOAD_ID","status":"initiated"},"parts":[]}',
  },
  {
    id: "complete",
    title: "完成上传",
    method: "POST",
    path: "/api/uploads/{id}/complete",
    scope: "uploads:write",
    description: "全部分片上传后调用，成功返回 file_id。请求可重试。",
    parameters: [["id", "Path · 必填", "上传任务 ID"]],
    example: `curl --fail-with-body -X POST "$OBJECT_URL/api/uploads/$UPLOAD_ID/complete" ${bearer}`,
    response: '{"file_id":"UPLOAD_ID","completed":true}',
  },
  {
    id: "abort",
    title: "取消上传",
    method: "POST",
    path: "/api/uploads/{id}/abort",
    scope: "uploads:write",
    description: "放弃未完成的上传任务，清理相应分片。",
    parameters: [["id", "Path · 必填", "上传任务 ID"]],
    example: `curl --fail-with-body -X POST "$OBJECT_URL/api/uploads/$UPLOAD_ID/abort" ${bearer}`,
    response: '{"status":"aborted"}',
  },
]

export function setupExample(origin: string) {
  return `export OBJECT_URL='${new URL(origin).origin}'\n# 从服务端环境或密钥管理器提供 OBJECT_TOKEN，不提交到代码仓库。`
}

export function buildSkill(origin: string) {
  return `---\nname: one-object\ndescription: Integrate server-side file uploads, downloads, deletion and resumable multipart transfers with One Object. Use when implementing an application integration with One Object.\n---\n\n# One Object\n\nBase URL: ${new URL(origin).origin}\nPublic API reference: ${new URL(origin).origin}/guide\n\nUse Authorization: Bearer $OBJECT_TOKEN only in server-side requests to Object. Read the Token from the application's secret configuration; never include a real Token in this skill, browser code, logs, or source control.\n\nThe application owns user/team authorization and file_id associations. Object enforces application isolation. Uploading does not require the end user to sign into Object. Configure permissions, buckets and optional folders in the authorization console. An empty folder uses one-object/. New Tokens do not expire by default; existing grants may have expiry dates. Selecting multiple buckets in the authorization form automatically enables weighted load balancing: omitted weight is 1, weights are positive integers up to 1000, and filename hashing chooses a bucket proportionally (not strict round-robin). Explicit storage_id overrides balancing. Disable/enable is reversible; deleting an authorization permanently invalidates its Token without deleting stored files. Do not pass prefix with an application Token: Object uses the grant's folder.\n\nFor files below 100,000,000 bytes use the raw-byte upload endpoint. For larger files read the upload policy, create a task, split using upload.part_size, upload numbered parts, and complete. Resume from the task's confirmed parts; do not blindly recreate tasks after a timeout.\n\nStore file_id, not a signed download URL. Fetch signed URLs when needed; do not forward Object credentials to storage hosts. Rotate a Token from the authorization console to preserve application ID and file ownership; creating another authorization does not transfer old files. Rotation invalidates the old Token immediately.\n\n${endpoints.map((endpoint) => `## ${endpoint.title}\n\n${endpoint.method} ${endpoint.path}\nRequired scope: ${endpoint.scope}\n\n${endpoint.description}\n\n${endpoint.parameters.map(([name, location, detail]) => `- ${name} (${location}): ${detail}`).join("\n")}\n\n\`\`\`sh\n${endpoint.example}\n\`\`\`\n\nResponse (illustrative):\n\`\`\`text\n${endpoint.response}\n\`\`\``).join("\n\n")}\n\nOn 401, check or replace the configured Token; on 403, check grant and owner permissions; on 409, inspect the upload task before retrying. Do not retry deletion or replace credentials without user authorization for that operation.\n`
}
