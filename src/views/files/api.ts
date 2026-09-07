import { request } from "@/lib/http"
export type ObjectFile = {
  id: string
  app_id: string
  original_filename: string
  file_size: number
  mime_type: string
  storage_id: string
  bucket_name: string
  created_at: number
}
export const listFiles = (
  offset: number,
  search: string,
  signal?: AbortSignal,
  storageId?: string,
) =>
  request<{ items: ObjectFile[]; total: number; limit: number }>(
    `/api/files?${new URLSearchParams({ offset: String(offset), search, ...(storageId ? { storage_id: storageId } : {}) })}`,
    { signal },
  )
export const deleteFile = (id: string) =>
  request<void>(`/api/files/${encodeURIComponent(id)}`, { method: "DELETE" })
