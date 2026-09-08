import { BookOpenIcon, DownloadIcon, ArrowUpRightIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { buildSkill, endpoints, setupExample } from "./content"

function Code({ value }: { value: string }) {
  return (
    <div className="relative min-w-0 rounded-lg bg-muted/60">
      <CopyButton
        value={value}
        aria-label="复制示例"
        variant="ghost"
        size="icon-sm"
        className="absolute right-2 top-2"
      />
      <pre className="overflow-x-auto p-4 pr-14 text-xs leading-6 sm:text-sm">
        <code>{value}</code>
      </pre>
    </div>
  )
}

export default function ApiGuide() {
  const origin = window.location.origin
  const skill = buildSkill(origin)
  return (
    <div className="h-svh overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-8">
          <a href="#overview" className="flex items-center gap-2 font-semibold">
            <BookOpenIcon className="size-5" />
            One Object{" "}
            <span className="text-sm font-normal text-muted-foreground">
              API 文档
            </span>
          </a>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a
                download="SKILL.md"
                href={`data:text/markdown;charset=utf-8,${encodeURIComponent(skill)}`}
              >
                <DownloadIcon />
                下载 Skill
              </a>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href="/dashboard">
                控制台
                <ArrowUpRightIcon />
              </a>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-8 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:self-start lg:overflow-y-auto">
          <nav
            aria-label="文档目录"
            className="flex flex-wrap gap-1 text-sm lg:flex-col"
          >
            <a
              href="#overview"
              className="rounded-md px-3 py-2 font-medium hover:bg-muted"
            >
              快速开始
            </a>
            <a
              href="#authentication"
              className="rounded-md px-3 py-2 hover:bg-muted"
            >
              认证与授权
            </a>
            {endpoints.map((endpoint) => (
              <a
                key={endpoint.id}
                href={`#${endpoint.id}`}
                className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {endpoint.title}
              </a>
            ))}
            <a href="#errors" className="rounded-md px-3 py-2 hover:bg-muted">
              错误处理
            </a>
            <a href="#skills" className="rounded-md px-3 py-2 hover:bg-muted">
              Agent Skill
            </a>
          </nav>
        </aside>
        <main className="min-w-0 space-y-12 pb-16">
          <section id="overview" className="scroll-mt-28 space-y-5">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Developer reference
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              文件存储 API
            </h1>
            <p className="text-sm leading-7 text-muted-foreground">
              通过服务端 Token
              接入上传、下载与分片续传。本文档公开访问，无需登录；API
              请求仍需要有效授权。
            </p>
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <span className="shrink-0 text-muted-foreground">Base URL</span>
              <code className="min-w-0 break-all">{origin}</code>
              <CopyButton
                value={origin}
                variant="ghost"
                size="icon-sm"
                aria-label="复制服务地址"
              />
            </div>
            <Code value={setupExample(origin)} />
            <p className="text-sm leading-7">
              先在控制台创建应用授权，选择权限和桶，再将 Token
              保存到接入应用的服务端环境变量 <code>OBJECT_TOKEN</code>
              。文件夹可选，留空使用 <code>one-object/</code>
              。新授权默认不过期。
            </p>
          </section>
          <section
            id="authentication"
            className="scroll-mt-28 space-y-4 border-t pt-8"
          >
            <h2 className="text-xl font-semibold">认证与授权</h2>
            <Code value={"Authorization: Bearer $OBJECT_TOKEN"} />
            <p className="text-sm leading-7 text-muted-foreground">
              Token
              只用于服务端调用，不下发到浏览器或移动端。调用应用管理用户、团队和业务记录与
              file_id 的关联。最终权限同时受 Token 范围和所属账号权限约束。
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              应用上传使用授权中配置的文件夹，请勿传入 prefix
              参数。授权选择多个桶时自动开启负载均衡，按文件名哈希和权重分配；未填权重按
              1，全部留空时均分（并非逐次轮询）。也可通过 storage_id
              指定目标桶。轮换 Token 保留授权 ID、文件归属、范围及有效期，旧
              Token 立即失效；新建另一条授权不会自动继承旧文件。
            </p>
          </section>
          {endpoints.map((endpoint) => (
            <section
              key={endpoint.id}
              id={endpoint.id}
              className="scroll-mt-28 space-y-5 border-t pt-8"
            >
              <h2 className="text-xl font-semibold">{endpoint.title}</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-primary/10 px-2 py-1 font-mono text-xs font-semibold text-primary">
                  {endpoint.method}
                </span>
                <code className="break-all text-sm">{endpoint.path}</code>
              </div>
              <p className="text-sm leading-7 text-muted-foreground">
                {endpoint.description}
              </p>
              <p className="text-xs text-muted-foreground">
                权限：<code>{endpoint.scope}</code>
              </p>
              {endpoint.parameters.length ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[30rem] text-left text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-3 font-medium">参数</th>
                        <th className="p-3 font-medium">位置 / 必填</th>
                        <th className="p-3 font-medium">说明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {endpoint.parameters.map(([name, location, detail]) => (
                        <tr key={name} className="border-t">
                          <td className="p-3 font-mono text-xs">{name}</td>
                          <td className="whitespace-nowrap p-3 text-xs">
                            {location}
                          </td>
                          <td className="p-3 text-muted-foreground">
                            {detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              <h3 className="text-sm font-medium">请求示例</h3>
              <Code
                value={endpoint.example.replaceAll("$OBJECT_URL", origin)}
              />
              <h3 className="text-sm font-medium">响应示例</h3>
              <Code value={endpoint.response} />
            </section>
          ))}
          <section id="errors" className="scroll-mt-28 space-y-4 border-t pt-8">
            <h2 className="text-xl font-semibold">错误处理</h2>
            <Code value={'{"message":"错误说明"}'} />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
              {[
                ["400", "检查参数、文件大小与分片长度。"],
                [
                  "401",
                  "Token 无效、已停用、已删除或过期；轮换后请更新服务端配置。",
                ],
                ["403", "检查账号权限、Token 操作权限、桶和文件夹范围。"],
                ["404", "资源不存在或不属于当前授权。"],
                ["409", "上传状态或文件内容冲突；先查询任务，再决定是否重试。"],
                [
                  "5xx",
                  "服务或存储暂时不可用。保留任务 ID，查询进度后恢复上传。",
                ],
              ].map(([status, message]) => (
                <div key={status} className="contents">
                  <dt className="font-mono">{status}</dt>
                  <dd className="text-muted-foreground">{message}</dd>
                </div>
              ))}
            </dl>
          </section>
          <section id="skills" className="scroll-mt-28 space-y-4 border-t pt-8">
            <h2 className="text-xl font-semibold">Agent Skill</h2>
            <p className="text-sm leading-7 text-muted-foreground">
              下载自包含的 SKILL.md，保存到你的 Agent 技能目录下的
              one-object/SKILL.md。包含本站地址、接口参数、上传流程和授权边界，不包含真实
              Token。
            </p>
            <Button asChild variant="outline">
              <a
                download="SKILL.md"
                href={`data:text/markdown;charset=utf-8,${encodeURIComponent(skill)}`}
              >
                <DownloadIcon />
                下载 SKILL.md
              </a>
            </Button>
          </section>
        </main>
      </div>
    </div>
  )
}
