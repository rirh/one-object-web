import { useEffect } from "react"

export function BuildInfo() {
  useEffect(() => {
    const print = (key: string, value: string) => {
      console.info(`[build-info] ${key}: ${value}`)
    }

    print("one-object-web", __APP_VERSION__)
    print("build time", formatBuildTime(__APP_BUILD_TIME__))
    print("environment", import.meta.env.VITE_APP_ENV)
  }, [])

  return null
}

function formatBuildTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(date)
}
