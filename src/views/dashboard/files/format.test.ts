import { expect, it } from "vitest"
import { formatModifiedTime } from "./format"

const now = new Date(2026, 8, 8, 12, 0)
it("uses precise relative wording without approximate prefixes", () => {
  expect(
    formatModifiedTime(
      new Date(2026, 8, 8, 11, 57).toISOString(),
      now,
      "zh-CN",
    ),
  ).toBe("3 分钟前")
  expect(
    formatModifiedTime(new Date(2026, 8, 8, 10, 0).toISOString(), now, "en-US"),
  ).toBe("2 hours ago")
  expect(
    formatModifiedTime(
      new Date(2026, 8, 8, 11, 59, 45).toISOString(),
      now,
      "zh-CN",
    ),
  ).toBe("刚刚")
})
it("uses a calendar month cutoff and formats older timestamps to minutes", () => {
  expect(
    formatModifiedTime(
      new Date(2026, 7, 8, 11, 59, 59).toISOString(),
      now,
      "zh-CN",
    ),
  ).toBe("2026-08-08 11:59")
  expect(
    formatModifiedTime(new Date(2026, 7, 8, 12, 0).toISOString(), now, "en-US"),
  ).toBe("1 month ago")
  const march = new Date(2026, 2, 31, 12, 0)
  expect(
    formatModifiedTime(
      new Date(2026, 1, 28, 11, 59).toISOString(),
      march,
      "zh-CN",
    ),
  ).toBe("2026-02-28 11:59")
})
it("handles absent, invalid and future timestamps", () => {
  expect(formatModifiedTime(null, now, "zh-CN")).toBe("—")
  expect(formatModifiedTime("invalid", now, "en-US")).toBe("—")
  expect(
    formatModifiedTime(
      new Date(2026, 8, 9, 12, 34, 56).toISOString(),
      now,
      "en-US",
    ),
  ).toBe("2026-09-09 12:34")
})
