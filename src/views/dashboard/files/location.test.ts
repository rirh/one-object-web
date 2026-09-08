import { afterEach, expect, it, vi } from "vitest"
import {
  fileLocationHref,
  filePath,
  filePrefix,
  readFileLocation,
  saveFileLocation,
} from "./location"

afterEach(() => vi.unstubAllGlobals())
it("round-trips directory paths with spaces, Unicode and literal URL characters", () => {
  for (const prefix of [
    "",
    "uploads/2026/04/",
    "报告 #1/100%/",
    "literal%2F/a+b/",
    "a//b/",
  ]) {
    const path = filePath("connection-onefile", prefix)
    expect(filePrefix(path)).toBe(prefix)
    expect(path.startsWith("/dashboard/files/connection-onefile")).toBe(true)
  }
})
it("persists only the last location and view, isolated by account", () => {
  const values = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  })
  const saved = {
    storageId: "connection-5",
    prefix: "uploads/2026/04/",
    view: "files" as const,
  }
  saveFileLocation("user-a", saved)
  expect(readFileLocation("user-a")).toEqual(saved)
  expect(readFileLocation("user-b")).toBeNull()
  expect(readFileLocation(undefined)).toBeNull()
})
it("ignores invalid storage and unavailable localStorage", () => {
  vi.stubGlobal("localStorage", {
    getItem: () => '{"storageId":"x","prefix":"","view":"unknown"}',
    setItem: () => {
      throw new Error("blocked")
    },
  })
  expect(readFileLocation("a")).toBeNull()
  expect(() =>
    saveFileLocation("a", { storageId: "x", prefix: "", view: "folders" }),
  ).not.toThrow()
  vi.stubGlobal("localStorage", { getItem: () => "bad json" })
  expect(readFileLocation("a")).toBeNull()
})

it("locates an exact object inside its containing folder without losing URL characters", () => {
  for (const key of [
    "report.txt",
    "one-object/sha256-abc/report.txt",
    "报告 #1/a+b%?.txt",
  ]) {
    const url = new URL(
      fileLocationHref("connection-onefile", key),
      "http://localhost",
    )
    expect(filePrefix(url.pathname)).toBe(
      key.slice(0, key.lastIndexOf("/") + 1),
    )
    expect(url.searchParams.get("focus")).toBe(key)
    expect(url.searchParams.get("view")).toBe("folders")
  }
})
