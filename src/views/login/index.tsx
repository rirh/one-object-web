import { LanguageToggle } from "@/components/language-toggle"
import { useObjectTranslation } from "@/local/object"
import { LogoMark } from "@/components/logo-mark"
import { Button } from "@/components/ui/button"
import pkg from "../../../package.json"

export function LoginPage() {
  const tx = useObjectTranslation()

  return (
    <main className="flex min-h-svh w-full items-center justify-center bg-muted px-4 py-10">
      <section
        className="flex min-h-72 w-full max-w-md flex-col rounded-2xl bg-white p-6 text-left text-slate-950 sm:p-7"
        aria-labelledby="login-title"
      >
        <div className="flex items-center gap-3">
          <LogoMark className="size-12" />
          <div className="min-w-0 flex-1">
            <h1
              id="login-title"
              className="text-xl font-semibold tracking-tight"
            >
              {pkg.appName}
            </h1>
            <p className="mt-0.5 font-mono text-[11px] text-slate-400">
              v{__APP_VERSION__}
            </p>
          </div>
          <LanguageToggle />
        </div>
        <div className="mt-9 space-y-2">
          <p className="text-base font-medium text-slate-800">
            {tx("让每一份文件，都井然有序。")}
          </p>
          <p className="max-w-sm text-sm leading-6 text-slate-500">
            {tx("统一上传、存储与管理文件，通过 One User 安全登录。")}
          </p>
        </div>
        <Button
          asChild
          size="lg"
          className="mt-auto h-11 min-w-32 self-end rounded-md px-5"
        >
          <a href="/api/auth/oidc/start">{tx("现在开始")}</a>
        </Button>
      </section>
    </main>
  )
}
