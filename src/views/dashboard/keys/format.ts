import { format, formatDistanceStrict, fromUnixTime, subMonths } from "date-fns"
import { enUS, zhCN } from "date-fns/locale"
import type { Locale } from "@/local"

export function formatKeyTime(timestamp: number, now: Date, locale: Locale) {
  const date = fromUnixTime(timestamp)
  if (date <= subMonths(now, 1) || date > now) {
    return format(date, "yyyy-MM-dd HH:mm")
  }
  return formatDistanceStrict(date, now, {
    addSuffix: true,
    roundingMethod: "floor",
    locale: locale === "zh-CN" ? zhCN : enUS,
  })
}
