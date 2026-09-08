import { json, request } from "@/lib/http"
export type AppKey = {
  id: string
  name: string
  scopes: string[]
  created_at: number
  expires_at: number
  revoked: boolean
}
export const keyScopes = [
  ["uploads:write", "上传文件"],
  ["files:read", "读取文件"],
  ["files:delete", "删除文件"],
] as const
export type AppKeyInput = {
  name: string
  scopes: string[]
  expires_in_days: number
}
export const listKeys = (signal?: AbortSignal) =>
  request<{ items: AppKey[] }>("/api/keys", { signal })
export const createKey = (input: AppKeyInput) =>
  request<{ id: string; token: string }>("/api/keys", json(input))
export const updateKey = (id: string, input: AppKeyInput) =>
  request<void>(`/api/keys/${encodeURIComponent(id)}`, {
    ...json(input),
    method: "PUT",
  })
export const revokeKey = (id: string) =>
  request<void>(`/api/keys/${encodeURIComponent(id)}`, { method: "DELETE" })
