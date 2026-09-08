import { describe, expect, it } from "vitest"
import { date, dateTime, relativeTime } from "./format"

describe("shared date formatting", () => {
  it("normalizes PostgreSQL and ISO timestamps to the same local time", () => {
    expect(dateTime("2026-09-07 08:12:34.123456+00")).toBe(
      dateTime("2026-09-07T08:12:34.123Z"),
    )
    expect(dateTime("2026-09-07T16:12:34+08:00")).toBe(
      dateTime("2026-09-07T08:12:34Z"),
    )
  })
  it("handles Unix seconds and invalid values", () => {
    expect(date(0)).toBe(dateTime("1970-01-01T00:00:00Z"))
    expect(dateTime("invalid")).toBe("—")
    expect(date(Number.NaN)).toBe("—")
  })
})

const now = new Date("2026-06-15T12:00:00Z")

describe("relativeTime", () => {
  it("formats ISO creation timestamps with the existing relative-date rule", () => {
    expect(relativeTime("2026-06-15T11:00:00Z", now, "en-US")).toBe(
      "1 hour ago",
    )
    expect(relativeTime("2026-06-15T11:00:00Z", now, "zh-CN")).toBe("1 小时前")
  })
  it("handles invalid and missing timestamps", () => {
    expect(relativeTime("invalid", now, "en-US")).toBe("—")
    expect(relativeTime("", now, "zh-CN")).toBe("—")
  })
})
