import {
  differenceInSeconds,
  format,
  formatDistanceStrict,
  isBefore,
  isValid,
  parseISO,
  subMonths,
} from "date-fns"
import { enUS, zhCN } from "date-fns/locale"
import type { Locale } from "@/local"

export function formatModifiedTime(
  value: string | null,
  now: Date,
  locale: Locale,
) {
  if (!value) return "—"
  const date = parseISO(value)
  if (!isValid(date)) return "—"
  if (isBefore(date, subMonths(now, 1)) || date > now) {
    return format(date, "yyyy-MM-dd HH:mm")
  }
  if (differenceInSeconds(now, date) < 60) {
    return locale === "zh-CN" ? "刚刚" : "Just now"
  }
  return formatDistanceStrict(date, now, {
    addSuffix: true,
    roundingMethod: "floor",
    locale: locale === "zh-CN" ? zhCN : enUS,
  })
}
