export type Entry = {
  key: string
  file?: File
  name: string
  size: number
  storageId: string
  prefix?: string
  id?: string
  status:
    "queued" | "uploading" | "paused" | "error" | "completed" | "cancelled"
  single?: boolean
  percent: number
  label: string
  expiresAt?: number
}
