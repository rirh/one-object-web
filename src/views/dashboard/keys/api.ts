import { json, request } from "@/lib/http"
export type AppKey = {
  id: string
  name: string
  scopes: string[]
  created_at: number
  expires_at: number
  revoked: boolean
}
export const listKeys = (signal?: AbortSignal) =>
  request<{ items: AppKey[] }>("/api/keys", { signal })
export const createKey = (input: {
  name: string
  scopes: string[]
  expires_in_days: number
}) => request<{ id: string; token: string }>("/api/keys", json(input))
export const revokeKey = (id: string) =>
  request<void>(`/api/keys/${id}`, { method: "DELETE" })
