# One Object Web

参照 One User 的 React / Vite / shadcn（radix-nova）后台布局。包含文件列表、分片上传/暂停/恢复、应用密钥、存储配置状态和接入说明；所有业务数据来自真实后端接口。

- 原生 fetch 统一封装：`src/lib/http.ts`；页面调用置于各自 `api.ts`。
- TanStack Query 管理服务端状态；TanStack Table 管理文件表格。
- React Hook Form / Zod 管理表单；Jotai 管理上传进度。
- 路由按需加载；移动端侧栏使用 Sheet，宽表格保留横向滚动。
- S3 凭证与应用密钥不写入浏览器持久存储。新密钥仅在创建后显示一次。

```bash
pnpm install
pnpm build
```

后端 `make dev` 构建并同源托管本项目。仅运行独立 Vite 时使用 `pnpm dev`（27526），设置 `VITE_DEV_BACKEND_URL`；同时调整后端 `APP_PUBLIC_URL` 和 One User 注册的 `/callback`。`pnpm build` 包含 TypeScript project-reference 检查。

刷新页面后从服务端列出未完成任务，重新选择原文件继续。客户端核对已上传分片 SHA-256，防止误选同名同大小但内容不同的文件。暂停取消当前 HTTP 请求；已确认分片持久保留，支持重试。100% 表示服务端合并完成，不只是字节发送完毕。

完整接入约定见 [integrations/README.md](../integrations/README.md)。发布仍由 one-action 执行，不从这里直接部署。
