import { describe, expect, it } from "vitest"
import { date, dateTime } from "./format"
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
