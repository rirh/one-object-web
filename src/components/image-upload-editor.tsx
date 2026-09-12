import { useObjectTranslation } from "@/local/object"
import { DialogActionButton } from "@/components/ui/dialog-action-button"
import { useId, useRef, useState } from "react"
import { toast } from "sonner"
import { SweepShine } from "@/components/sweep-shine"
import CropEditor, { useAvatarEditor } from "react-avatar-editor"
import { UploadIcon, ZoomInIcon, ZoomOutIcon } from "lucide-react"
import { Slider } from "radix-ui"
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogDescription,
  ResponsiveDialogBody,
  ResponsiveDialogFooter,
} from "@/components/ui/responsive-dialog"
import { useMutation } from "@tanstack/react-query"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"

export function ImageUploadEditor({
  url,
  label,
  square = false,
  upload,
  onSaved,
  children,
}: {
  url?: string | null
  label: string
  square?: boolean
  upload: (file: File) => Promise<string>
  onSaved: (url: string) => Promise<void> | void
  children?: React.ReactNode
}) {
  const t = useObjectTranslation()
  const zoomLabel = useId()
  const input = useRef<HTMLInputElement>(null)
  const editor = useAvatarEditor()
  const [file, setFile] = useState<File | null>(null)
  const [scale, setScale] = useState(1)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const mutation = useMutation({
    mutationFn: async () => {
      const file = await new Promise<File>((resolve, reject) => {
        const canvas = editor.getImageScaledToCanvas()
        if (!canvas) return reject(new Error(t("无法读取图片，请重新选择。")))
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error(t("无法读取图片，请重新选择。")))
          resolve(new File([blob], "avatar.png", { type: "image/png" }))
        }, "image/png")
      })
      if (file.size === 0 || file.size > 5 * 1024 * 1024) {
        throw new Error(t("支持 PNG、JPEG、WebP，最大 5 MiB。"))
      }
      return upload(file)
    },
    onSuccess: async (url) => {
      setFile(null)
      await onSaved(url)
      toast.success(t("上传成功"))
    },
  })
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        aria-label={t("选择图片")}
        title={t("支持 PNG、JPEG、WebP，最大 5 MiB。")}
        disabled={mutation.isPending}
        aria-busy={mutation.isPending}
        onClick={() => input.current?.click()}
        style={{ borderRadius: square ? 0 : undefined }}
        className="group relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
      >
        <Avatar className={square ? "size-12 rounded-none" : "size-12"}>
          <AvatarImage src={url || undefined} alt={label} />
          <AvatarFallback className={square ? "rounded-none" : undefined}>
            {children || <UploadIcon className="size-5" />}
          </AvatarFallback>
        </Avatar>
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <UploadIcon className="size-5" aria-hidden="true" />
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <Input
          ref={input}
          className="sr-only"
          tabIndex={-1}
          aria-label={t("选择图片")}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          disabled={mutation.isPending}
          onChange={(event) => {
            const selected = event.target.files?.[0]
            event.target.value = ""
            if (!selected) return
            mutation.reset()
            setError("")
            if (
              !selected.size ||
              selected.size > 5 * 1024 * 1024 ||
              !["image/png", "image/jpeg", "image/webp"].includes(selected.type)
            ) {
              setError(t("支持 PNG、JPEG、WebP，最大 5 MiB。"))
              return
            }
            setReady(false)
            setScale(1)
            setFile(selected)
          }}
        />
        {!file && (error || mutation.isError) && (
          <p role="alert" className="mt-2 text-xs text-destructive">
            {error || mutation.error?.message}
          </p>
        )}
      </div>
      <ResponsiveDialog
        open={!!file}
        onOpenChange={(open) => {
          if (!open && !mutation.isPending) {
            setFile(null)
            setError("")
          }
        }}
      >
        <ResponsiveDialogContent
          className="sm:max-w-[340px]"
          showCloseButton={!mutation.isPending}
        >
          <ResponsiveDialogHeader className="bg-transparent px-4 pt-4 pb-3">
            <ResponsiveDialogTitle>
              {square ? label : t("裁剪图片")}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t("拖动图片调整位置，缩放后保存。")}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogBody className="space-y-3 pt-0 pb-4">
            <div
              className="flex justify-center overflow-hidden rounded-xl bg-zinc-950 ring-1 ring-black/5"
              data-vaul-no-drag
            >
              {file && (
                <CropEditor
                  ref={editor.ref}
                  image={file}
                  width={240}
                  height={240}
                  border={24}
                  color={[9, 9, 11, 0.78]}
                  borderColor={[255, 255, 255, 0.8]}
                  borderRadius={square ? 0 : 120}
                  scale={scale}
                  onImageReady={() => setReady(true)}
                  onLoadFailure={() => {
                    setReady(false)
                    setError(t("无法读取图片，请重新选择。"))
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    maxWidth: "100%",
                    cursor: "grab",
                    height: "auto",
                    touchAction: "none",
                  }}
                />
              )}
            </div>
            <div
              className="space-y-2 rounded-lg bg-muted/60 px-3 py-2.5"
              data-vaul-no-drag
            >
              <div className="flex items-center justify-between text-xs">
                <span id={zoomLabel} className="text-muted-foreground">
                  {t("缩放")}
                </span>
                <span className="font-medium tabular-nums">
                  {Math.round(scale * 100)}%
                </span>
              </div>
              <div className="flex h-5 items-center gap-3">
                <ZoomOutIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                <Slider.Root
                  className="relative flex h-5 min-w-0 flex-1 touch-none items-center select-none data-disabled:opacity-50"
                  min={1}
                  max={3}
                  step={0.01}
                  value={[scale]}
                  disabled={!ready || mutation.isPending}
                  onValueChange={([value]) => setScale(value)}
                >
                  <Slider.Track className="relative h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
                    <Slider.Range className="absolute h-full bg-primary" />
                  </Slider.Track>
                  <Slider.Thumb
                    aria-labelledby={zoomLabel}
                    className="block size-3.5 rounded-full border border-primary/30 bg-background shadow-sm ring-primary/20 transition-shadow outline-none hover:ring-4 focus-visible:ring-4"
                  />
                </Slider.Root>
                <ZoomInIcon
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              </div>
            </div>
            {(error || mutation.isError) && (
              <p role="alert" className="text-xs text-destructive">
                {error || mutation.error?.message}
              </p>
            )}
          </ResponsiveDialogBody>
          <ResponsiveDialogFooter className="border-t bg-transparent py-3">
            <DialogActionButton
              action="cancel"
              size="sm"
              variant="ghost"
              disabled={mutation.isPending}
              onClick={() => {
                setFile(null)
                setError("")
              }}
            >
              {t("取消")}
            </DialogActionButton>
            <DialogActionButton
              action="confirm"
              size="sm"
              disabled={!ready || mutation.isPending}
              aria-busy={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? (
                <SweepShine>{t("上传中…")}</SweepShine>
              ) : (
                t("保存图片")
              )}
            </DialogActionButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </div>
  )
}
