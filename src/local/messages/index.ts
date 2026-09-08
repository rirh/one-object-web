import { zhCN } from "./zh-CN"
import { enUS } from "./en-US"
export const messages = { "zh-CN": zhCN, "en-US": enUS } as const

export type Locale = keyof typeof messages
export type MessageKey = keyof (typeof messages)["zh-CN"]
