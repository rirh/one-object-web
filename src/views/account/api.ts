import { ApiError, request } from "@/lib/http"
export type User = { sub: string; name?: string; email?: string }
export async function getUser(signal?: AbortSignal) {
  try {
    return (await request<{ user: User }>("/api/auth/me", { signal })).user
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}
export const logout = () =>
  request<void>("/api/auth/logout", { method: "POST" })
