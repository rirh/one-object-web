import { request } from "@/lib/http"

export type ServiceStatus = {
  status: "ok" | "ready"
  service?: string
  version?: string
}
export const getLiveness = () => request<ServiceStatus>("/healthz")
export const getReadiness = () => request<ServiceStatus>("/readyz")
