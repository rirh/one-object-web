import { isImageFile } from "../links"
import { useEffect, useRef, useState } from "react"
import {
  FileArchiveIcon,
  FileAudioIcon,
  FileCodeIcon,
  FileIcon as GenericFileIcon,
  FileImageIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileVideoIcon,
  PresentationIcon,
} from "lucide-react"

export function FileIcon({
  name,
  mimeType,
  href,
}: {
  name: string
  mimeType?: string
  href: string
}) {
  const container = useRef<HTMLSpanElement>(null)
  const [visibleHref, setVisibleHref] = useState<string>()
  const [failedHref, setFailedHref] = useState<string>()
  const extension = name.split(".").at(-1)?.toLowerCase() ?? ""
  const image = isImageFile(name, mimeType)
  useEffect(() => {
    const element = container.current
    if (!image || !element) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleHref(href)
          observer.disconnect()
        }
      },
      { rootMargin: "0px", threshold: 0 },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [href, image])

  const Icon = image
    ? FileImageIcon
    : mimeType?.startsWith("video/") ||
        /^(mp4|mov|avi|mkv|webm|m4v)$/.test(extension)
      ? FileVideoIcon
      : mimeType?.startsWith("audio/") ||
          /^(mp3|wav|ogg|flac|aac|m4a)$/.test(extension)
        ? FileAudioIcon
        : /^(zip|rar|7z|tar|gz|bz2|xz)$/.test(extension)
          ? FileArchiveIcon
          : /^(csv|tsv|xls|xlsx|ods)$/.test(extension)
            ? FileSpreadsheetIcon
            : /^(ppt|pptx|odp)$/.test(extension)
              ? PresentationIcon
              : /^(js|jsx|ts|tsx|json|html|css|xml|yaml|yml|py|rs|go|java|sh|sql)$/.test(
                    extension,
                  )
                ? FileCodeIcon
                : mimeType?.startsWith("text/") ||
                    /^(pdf|doc|docx|txt|md|rtf|odt)$/.test(extension)
                  ? FileTextIcon
                  : GenericFileIcon

  return (
    <span
      ref={container}
      className="relative flex size-6 shrink-0 items-center justify-center overflow-hidden rounded text-muted-foreground"
      aria-hidden="true"
    >
      <Icon className="size-4" />
      {image && visibleHref === href && failedHref !== href && (
        <img
          src={href}
          alt=""
          decoding="async"
          width={24}
          height={24}
          className="absolute inset-0 size-6 object-cover"
          onError={() => setFailedHref(href)}
        />
      )}
    </span>
  )
}
