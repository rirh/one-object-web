import { fromUnixTime } from "date-fns"
import { relativeTime } from "@/lib/format"
import type { Locale } from "@/local"

export function formatKeyTime(timestamp: number, now: Date, locale: Locale) {
  return relativeTime(fromUnixTime(timestamp), now, locale)
}
