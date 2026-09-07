import { json, request } from "@/lib/http"
export type Bucket = {
  id: string
  name: string
  bucket: string
  region: string
  enabled: boolean
  cloud_state: "unknown" | "present" | "missing" | "deleted"
}
const path = (id: string) => `/api/storage/accounts/${encodeURIComponent(id)}`
export const listBuckets = (id: string, signal?: AbortSignal) =>
  request<{ items: Bucket[]; synced_at: number | null }>(
    `${path(id)}/buckets`,
    { signal },
  )
export const syncBuckets = (id: string) =>
  request<{ count: number }>(`${path(id)}/sync`, { method: "POST" })
export const createBucket = (id: string, bucket: string, region?: string) =>
  request<{ id: string }>(`${path(id)}/buckets`, json({ bucket, region }))
export const deleteBucket = (
  id: string,
  bucket: string,
  confirm_name: string,
) =>
  request<void>(`${path(id)}/buckets/${encodeURIComponent(bucket)}`, {
    ...json({ confirm_name }),
    method: "DELETE",
  })
