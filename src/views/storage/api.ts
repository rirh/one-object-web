import { request } from "@/lib/http"
export const getStorage = (signal?: AbortSignal) =>
  request<{
    configured: boolean
    bucket: string
    region: string
    part_size: number
    max_file_size: number
  }>("/api/storage", { signal })
