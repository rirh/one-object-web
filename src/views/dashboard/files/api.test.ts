import { afterEach, expect, it, vi } from "vitest"
import { deleteStorageObjects, listStorageObjects } from "./api"
afterEach(() => vi.unstubAllGlobals())
it("keeps path and continuation cursor while switching between flat files and directory listing", async () => {
  const fetch = vi
    .fn()
    .mockImplementation(async () => Response.json({ items: [] }))
  vi.stubGlobal("fetch", fetch)
  await listStorageObjects(
    "bucket",
    "folder with spaces/",
    "opaque+/=",
    undefined,
    true,
  )
  const flat = new URL(fetch.mock.calls[0][0], "http://localhost")
  expect(flat.searchParams.get("recursive")).toBe("true")
  expect(flat.searchParams.get("prefix")).toBe("folder with spaces/")
  expect(flat.searchParams.get("cursor")).toBe("opaque+/=")
  await listStorageObjects("bucket", "folder/", undefined, undefined, false)
  const folders = new URL(fetch.mock.calls[1][0], "http://localhost")
  expect(folders.searchParams.get("recursive")).toBe("false")
  expect(folders.searchParams.has("cursor")).toBe(false)
})

it("passes a literal partial prefix to cloud listing without converting it to a folder", async () => {
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json({ items: [] }),
  )
  vi.stubGlobal("fetch", fetch)
  const prefix = "uploads/2026/报告 + draft"
  await listStorageObjects("bucket", prefix, undefined, undefined, true)
  const request = new URL(String(fetch.mock.calls[0]?.[0]), "http://localhost")
  expect(request.searchParams.get("prefix")).toBe(prefix)
  expect(request.searchParams.get("recursive")).toBe("true")
})

it("sends exact selected keys in one batch and preserves partial failures", async () => {
  const result = {
    deleted: ["报告 + draft.txt"],
    failed: [{ key: "b.txt", message: "denied" }],
  }
  const fetch = vi.fn<typeof globalThis.fetch>(async () =>
    Response.json(result),
  )
  vi.stubGlobal("fetch", fetch)
  expect(
    await deleteStorageObjects("bucket", ["报告 + draft.txt", "b.txt"]),
  ).toEqual(result)
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch.mock.calls[0]?.[0]).toBe("/api/files/objects/batch-delete")
  const init = fetch.mock.calls[0]?.[1]
  expect(init?.method).toBe("POST")
  expect(JSON.parse(String(init?.body))).toEqual({
    storage_id: "bucket",
    keys: ["报告 + draft.txt", "b.txt"],
  })
})
