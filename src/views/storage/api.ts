import { json, request } from "@/lib/http"
export const PROVIDERS = {
  r2: "Cloudflare R2",
  aws: "AWS S3",
  aliyun: "阿里云 OSS",
  tencent: "腾讯云 COS",
} as const
export type Provider = keyof typeof PROVIDERS
export type StorageConnection = {
  id: string
  name: string
  provider: Provider
  bucket: string
  region: string
  endpoint: string
  enabled: boolean
  created_at: number
}
export type ConnectionInput = {
  name: string
  provider: Provider
  bucket: string
  region: string
  account_id: string
  access_key: string
  secret_key: string
}
export const listConnections = (signal?: AbortSignal) =>
  request<{ items: StorageConnection[] }>("/api/storage/connections", {
    signal,
  })
export const createConnection = (input: ConnectionInput) =>
  request<{ id: string }>("/api/storage/connections", json(input))
export const updateConnection = (
  id: string,
  input: {
    name: string
    enabled: boolean
    access_key?: string
    secret_key?: string
  },
) =>
  request<void>(`/api/storage/connections/${id}`, {
    ...json(input),
    method: "PUT",
  })
export const checkConnection = (id: string) =>
  request<{ ok: boolean; message: string }>(
    `/api/storage/connections/${id}/check`,
    { method: "POST" },
  )
