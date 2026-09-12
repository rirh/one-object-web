import { useObjectTranslation } from "@/local/object"
import { listConnections } from "@/views/dashboard/storage/api"
import { useState, type ImgHTMLAttributes } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { ImageUploadEditor } from "@/components/image-upload-editor"
import { Button } from "@/components/ui/button"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog"

async function branding(
  path: string,
  init?: RequestInit,
): Promise<{ logo_url: string | null }> {
  const response = await fetch(path, { credentials: "same-origin", ...init })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.message || "品牌设置暂不可用")
  }
  return response.json()
}
const queryKey = ["branding"] as const
export function BrandLogo(props: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState<string | null>(null)
  const { data } = useQuery({
    queryKey,
    queryFn: () => branding("/api/branding"),
    retry: false,
  })
  const url = data?.logo_url
  return (
    <img
      {...props}
      src={
        url && failed !== url
          ? url
          : `${import.meta.env.BASE_URL}one-object-logo.svg`
      }
      onError={() => setFailed(url || null)}
    />
  )
}
export function BrandSettings() {
  const t = useObjectTranslation()
  const [open, setOpen] = useState(false)
  const [storageId, setStorageId] = useState("")
  const storages = useQuery({
    queryKey: ["brand-storage-options"],
    queryFn: () => listConnections(),
    enabled: open,
  })
  const queryClient = useQueryClient()
  const access = useQuery({
    queryKey: ["brand-settings"],
    queryFn: () => branding("/api/admin/branding"),
    retry: false,
  })
  if (!access.data) return null
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        {t("品牌 / Logo")}
      </Button>
      <ResponsiveDialog open={open} onOpenChange={setOpen}>
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>{t("品牌 / Logo 设置")}</ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("上传方形图片，作为本站登录页和导航中的品牌图标。")}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody>
            <label className="mb-4 block space-y-2 text-sm">
              {t("存储桶")}
              <select
                aria-label={t("品牌图片存储桶")}
                className="h-9 w-full rounded-md border bg-background px-2"
                value={storageId}
                onChange={(event) => setStorageId(event.target.value)}
              >
                <option value="">{t("默认存储")}</option>
                {storages.data?.items
                  .filter((item) => item.enabled)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} / {item.bucket}
                    </option>
                  ))}
              </select>
            </label>
            <ImageUploadEditor
              square
              url={access.data.logo_url}
              label={t("品牌图标")}
              upload={async (file) => {
                const result = await branding(
                  `/api/admin/branding?${new URLSearchParams(storageId ? { storage_id: storageId } : {})}`,
                  {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                  },
                )
                if (!result.logo_url) throw new Error(t("上传未返回图片 URL"))
                return result.logo_url
              }}
              onSaved={async (logo_url) => {
                queryClient.setQueryData(queryKey, { logo_url })
                queryClient.setQueryData(["brand-settings"], { logo_url })
              }}
            />
          </ResponsiveDialogBody>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  )
}
