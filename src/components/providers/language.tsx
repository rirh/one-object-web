import * as React from "react"

import { LanguageContext } from "@/components/providers/language-context"
import {
  applyDocumentLocale,
  getInitialLocale,
  persistLocale,
  translate,
  type Locale,
  type MessageKey,
} from "@/local"

export function LanguageProvider({ children }: React.PropsWithChildren) {
  const [locale, setLocale] = React.useState<Locale>(getInitialLocale)

  React.useEffect(() => {
    applyDocumentLocale(locale)
    persistLocale(locale)
  }, [locale])

  const t = React.useCallback(
    (key: MessageKey) => translate(locale, key),
    [locale],
  )
  const value = React.useMemo(() => ({ locale, setLocale, t }), [locale, t])

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
