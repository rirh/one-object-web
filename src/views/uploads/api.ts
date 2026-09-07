import { json, request } from "@/lib/http"
export type Upload = {
  id: string
  original_filename: string
  file_size: number
  part_size: number
  total_parts: number
  status: string
  expires_at: number
}
export type UploadState = {
  upload: Upload
  parts: { part_number: number; sha256: string; size: number }[]
}
export const listUploads = (signal?: AbortSignal) =>
  request<{ items: Upload[] }>("/api/uploads", { signal })
export const getUpload = (id: string, signal?: AbortSignal) =>
  request<UploadState>(`/api/uploads/${id}`, { signal })
export const abortUpload = (id: string) =>
  request<{ status: string }>(`/api/uploads/${id}/abort`, { method: "POST" })
export async function uploadFile(
  file: File,
  id: string | undefined,
  signal: AbortSignal,
  progress: (id: string, percent: number) => void,
) {
  if (!file.size) throw new Error("请选择非空文件")
  const state = id
    ? await getUpload(id, signal)
    : await request<UploadState>("/api/uploads", {
        ...json({
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream",
        }),
        signal,
      })
  const upload = state.upload
  progress(upload.id, 0)
  if (upload.original_filename !== file.name || upload.file_size !== file.size)
    throw new Error("请选择与上传任务名称、大小一致的原文件")
  if (upload.status === "completed") return upload.id
  if (upload.status !== "initiated")
    throw new Error("上传任务已结束，请重新上传")
  const confirmed = new Map(state.parts.map((part) => [part.part_number, part]))
  for (let number = 1; number <= upload.total_parts; number++) {
    signal.throwIfAborted()
    const chunk = file.slice(
      (number - 1) * upload.part_size,
      Math.min(number * upload.part_size, file.size),
    )
    const previous = confirmed.get(number)
    if (previous) {
      // Re-selecting a different file must never silently produce mixed old/new content.
      const digest = await crypto.subtle.digest(
        "SHA-256",
        await chunk.arrayBuffer(),
      )
      const hash = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("")
      if (hash !== previous.sha256)
        throw new Error("已上传分片与所选文件不一致，请取消任务并重新上传")
    } else {
      await request(`/api/uploads/${upload.id}/parts/${number}`, {
        method: "PUT",
        headers: { "Content-Type": "application/octet-stream" },
        body: chunk,
        signal,
      })
    }
    progress(upload.id, Math.round((number / upload.total_parts) * 99))
  }
  signal.throwIfAborted()
  await request(`/api/uploads/${upload.id}/complete`, {
    method: "POST",
    signal,
  })
  progress(upload.id, 100)
  return upload.id
}
