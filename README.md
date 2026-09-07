# One Object Web

参照 One User 的 React / Vite / shadcn（radix-nova）后台布局。包含文件列表、分片上传/暂停/恢复、应用密钥、存储配置状态和接入说明；所有业务数据来自真实后端接口。

- 原生 fetch 统一封装：`src/lib/http.ts`；页面调用置于各自 `api.ts`。
- TanStack Query 管理服务端状态；TanStack Table 管理文件表格。
- React Hook Form / Zod 管理表单；Jotai 管理上传进度。
- 路由按需加载；移动端侧栏使用 Sheet，宽表格保留横向滚动。
- S3 凭证与应用密钥不写入浏览器持久存储。新密钥仅在创建后显示一次。

```bash
pnpm install
pnpm lint
pnpm build
```

开发时分别运行本项目 `pnpm dev` 和后端 `make dev`，浏览器访问 `http://127.0.0.1:27525`。后端在 `ENV=dev|development` 下将页面与资源代理到 Vite（27526），API、登录与回调仍由后端处理，HMR 直接连接 27526。无需构建、复制 web-dist 或修改 One User 回调。生产环境仍托管构建产物；`pnpm build` 包含 TypeScript 检查。

刷新页面后从服务端列出未完成任务，重新选择原文件继续。客户端核对已上传分片 SHA-256，防止误选同名同大小但内容不同的文件。暂停取消当前 HTTP 请求；已确认分片持久保留，支持重试。100% 表示服务端合并完成，不只是字节发送完毕。

完整接入约定见 [integrations/README.md](../integrations/README.md)。发布仍由 one-action 执行，不从这里直接部署。

## Web 环境配置

与 One Browser 一致，dev、stage、prod 分别使用 `.env.development`、`.env.stage`、`.env.production`。`pnpm dev` 加载 development，`pnpm build:stage` 加载 stage，`pnpm build` 加载 production。

开发代理默认指向 `http://127.0.0.1:27525`，可通过 `VITE_DEV_BACKEND_URL` 覆盖。`VITE_BASE_URL` 控制资源基础路径；接口保持同源。环境文件只存放公开配置。

Vite 从 package.json 读取应用名称和版本，可使用 `VITE_APP_NAME`、`VITE_APP_VERSION`、`VITE_BUILD_TIME` 覆盖，并生成 `app-version.json`。`pnpm lint` 使用与 One Browser 相同的 Oxlint 规则，警告也视为失败。

## One User 管理框架复用

管理框架直接迁自 `one-user/web`：AppShell 侧栏与多页签、主题/语言 Provider、ResourceTable、响应式弹窗、角色编辑与权限树管理。品牌、权限前缀、用户资料、接口合同和 Object 模块已改写；不迁移密码、验证码、OAuth 服务端或应用审核模块。

- `/dashboard`：可访问模块入口；`/dashboard/files`、`uploads`、`keys`、`storage`、`integration` 为 Object 业务。
- `/dashboard/admin?section=users|roles|permissions|login-events|operation-logs`：通用管理模块。
- `/dashboard/account`：当前统一登录身份。
- 原 `/files`、`/uploads`、`/keys`、`/storage`、`/integration` 自动跳转，原 Logo、登录入口和 PWA 继续使用。

菜单读取后端有效权限和权限树；前端路由与操作按钮做权限检查，后端仍为授权依据。权限每 30 秒刷新，页面聚焦时也重新读取。用户和日志使用与 One User 相同的表格；每批加载 50 条，支持加载更多，再在已加载数据内筛选和分页。少于 10 条时不显示分页。

`src/views/dashboard/admin/api/rbac-api.ts` 对齐 Object 的 PUT/集合响应合同；用户绑定 One User sub，不在 Object 创建密码。数据时间统一使用 date-fns，页面显示本地时区 `yyyy-MM-dd HH:mm:ss`；构建时间保留毫秒和时区，可继续用 `VITE_BUILD_TIME` 覆盖。
