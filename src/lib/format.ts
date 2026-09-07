import { format, fromUnixTime, isValid, parseISO } from "date-fns"
export function bytes(size: number) {
  if (size < 1024) return `${size} B`
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), 4)
  return `${(size / 1024 ** index).toFixed(1)} ${["B", "KiB", "MiB", "GiB", "TiB"][index]}`
}
export function dateTime(value: string | Date) {
  const parsed = typeof value === "string" ? parseISO(value) : value
  return isValid(parsed) ? format(parsed, "yyyy-MM-dd HH:mm:ss") : "—"
}
export const date = (seconds: number) => dateTime(fromUnixTime(seconds))
