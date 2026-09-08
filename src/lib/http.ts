export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}
export async function request<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs = 160_000,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    signal: init.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)])
      : AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      message?: string
    }
    throw new ApiError(
      response.status,
      data.message || `请求失败（${response.status}）`,
    )
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>)
}
export function json(value: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  }
}
