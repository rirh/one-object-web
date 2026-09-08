import { useCallback } from "react"
import { useTranslation } from "@/components/providers/language-context"
import type { Locale } from "@/local"
import { objectEnglish } from "./object-messages"

type Values = Record<string, string | number>

// Source-language keys also let static provider guides and validation messages
// be translated at their presentation boundary without changing stored data.
export function translateObject(
  locale: Locale,
  message: string,
  values?: Values,
) {
  if (locale === "en-US" && !Object.hasOwn(objectEnglish, message)) {
    const patterns: [RegExp, string][] = [
      [/^校验 (\d+)%$/, "校验 {0}%"],
      [/^传输分片 (\d+)\/(\d+)$/, "传输分片 {0}/{1}"],
      [/^等待云端确认 (\d+)\/(\d+)$/, "等待云端确认 {0}/{1}"],
      [/^请求失败（(\d+)）$/, "请求失败（{0}）"],
    ]
    for (const [pattern, key] of patterns) {
      const match = message.match(pattern)
      if (match)
        return translateObject(
          locale,
          key,
          Object.fromEntries(
            match.slice(1).map((value, index) => [String(index), value]),
          ),
        )
    }
  }
  const template =
    locale === "en-US"
      ? Object.hasOwn(objectEnglish, message)
        ? objectEnglish[message]
        : message
      : message
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    values && key in values ? String(values[key]) : match,
  )
}

export function useObjectTranslation() {
  const { locale } = useTranslation()
  return useCallback(
    (message: string, values?: Values) =>
      translateObject(locale, message, values),
    [locale],
  )
}
