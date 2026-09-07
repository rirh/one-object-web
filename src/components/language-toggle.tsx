import { LanguagesIcon } from "lucide-react"

import { useLanguage } from "@/components/providers/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Locale, MessageKey } from "@/local"

const localeOptions = [
  { value: "zh-CN", labelKey: "language.zh" },
  { value: "en-US", labelKey: "language.en" },
] as const satisfies ReadonlyArray<{
  value: Locale
  labelKey: MessageKey
}>

export function LanguageToggle() {
  const { locale, setLocale, t } = useLanguage()

  function handleLocaleChange(value: string) {
    const option = localeOptions.find((item) => item.value === value)
    if (option) {
      setLocale(option.value)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          aria-label={t("language.switch")}
          title={t("language.switch")}
        >
          <LanguagesIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("language.current")}</DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={locale}
            onValueChange={handleLocaleChange}
          >
            {localeOptions.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
