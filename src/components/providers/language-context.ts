import * as React from "react"

import type { Locale, MessageKey } from "@/local"

export type LanguageContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey) => string
}

export const LanguageContext = React.createContext<LanguageContextValue | null>(
  null
)

export function useLanguage() {
  const context = React.useContext(LanguageContext)

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }

  return context
}

export function useTranslation() {
  const { locale, t } = useLanguage()
  return { locale, t }
}
