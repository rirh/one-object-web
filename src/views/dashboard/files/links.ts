export function isImageFile(name: string, mimeType?: string) {
  return (
    !!mimeType?.startsWith("image/") ||
    /\.(avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|tiff?|webp)$/i.test(name)
  )
}
export function objectDownloadHref(storageId: string, key: string) {
  return `/api/files/objects/download?${new URLSearchParams({ storage_id: storageId, key })}`
}
