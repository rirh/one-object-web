import { messages, type Locale, type MessageKey } from "./messages"

const LOCALE_STORAGE_KEY = "one-object:locale"

export function getInitialLocale(): Locale {
  try {
    const storedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isLocale(storedLocale)) {
      return storedLocale
    }
  } catch {
    // Browser storage is optional; navigator language remains available.
  }

  return window.navigator.language.toLowerCase().startsWith("zh")
    ? "zh-CN"
    : "en-US"
}

export function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Language switching should still work when storage is unavailable.
  }
}

export function applyDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale
}

export function translate(locale: Locale, key: MessageKey) {
  return messages[locale][key]
}

function isLocale(value: string | null): value is Locale {
  return value === "zh-CN" || value === "en-US"
}

export type { Locale, MessageKey }
