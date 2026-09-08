import { ApiError, request } from "@/lib/http"
export type User = {
  picture?: string | null
  sub: string
  name?: string
  email?: string
}
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

export type AuthUser = User & {
  user_id: string
  user_name: string
  display_name: string
}
export const accountQueryKeys = { root: ["account"] as const }
export const authUserQuery = {
  queryKey: ["account"] as const,
  queryFn: async ({ signal }: { signal: AbortSignal }) => {
    const user = await getUser(signal)
    return user
      ? {
          ...user,
          user_id: user.sub,
          user_name: user.email || user.sub,
          display_name: user.name || user.email || "One User 用户",
        }
      : null
  },
  retry: false,
}
