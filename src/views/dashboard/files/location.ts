export type FileView = "folders" | "files"
export type FileLocation = { storageId: string; prefix: string; view: FileView }
const BASE = "/dashboard/files"

export function filePath(storageId: string, prefix = "") {
  return `${BASE}/${encodeURIComponent(storageId)}${prefix ? "/" + prefix.split("/").map(encodeURIComponent).join("/") : ""}`
}

export function filePrefix(pathname: string) {
  const segments = pathname
    .slice(BASE.length + 1)
    .split("/")
    .slice(1)
  try {
    return segments.map(decodeURIComponent).join("/")
  } catch {
    return ""
  }
}

function storageKey(userId: string) {
  return `one-object:files-location:${userId}`
}
export function readFileLocation(
  userId: string | undefined,
): FileLocation | null {
  if (!userId) return null
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(storageKey(userId)) || "null",
    )
    if (!value || typeof value !== "object") return null
    const saved = value as Partial<FileLocation>
    if (
      typeof saved.storageId !== "string" ||
      !saved.storageId ||
      typeof saved.prefix !== "string" ||
      !["folders", "files"].includes(saved.view || "")
    )
      return null
    return {
      storageId: saved.storageId,
      prefix: saved.prefix,
      view: saved.view as FileView,
    }
  } catch {
    return null
  }
}
export function saveFileLocation(
  userId: string | undefined,
  value: FileLocation,
) {
  if (!userId) return
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(value))
  } catch {
    /* Storage is optional. */
  }
}

export function fileLocationHref(storageId: string, key: string) {
  const prefix = key.slice(0, key.lastIndexOf("/") + 1)
  return `${filePath(storageId, prefix)}?${new URLSearchParams({ view: "folders", focus: key })}`
}
