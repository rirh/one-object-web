import { afterEach, describe, expect, it, vi } from "vitest"
import { uploadFile, selectPartSize } from "./api"
const upload = {
  id: "test",
  original_filename: "a.txt",
  file_size: 6,
  part_size: 3,
  total_parts: 2,
  status: "initiated",
  expires_at: 9999999999,
}
const sha = async (text: string) =>
  Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
    (byte) => byte.toString(16).padStart(2, "0"),
  ).join("")
afterEach(() => vi.unstubAllGlobals())
describe("resumable upload", () => {
  it("verifies existing bytes and uploads only the missing part before completing", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          upload,
          parts: [{ part_number: 1, sha256: await sha("abc"), size: 3 }],
        }),
      )
      .mockResolvedValueOnce(Response.json({ part: {} }))
      .mockResolvedValueOnce(
        Response.json({ completed: true, file_id: "test" }),
      )
    vi.stubGlobal("fetch", fetch)
    const progress = vi.fn()
    expect(
      await uploadFile(
        new File(["abcdef"], "a.txt"),
        "test",
        new AbortController().signal,
        progress,
      ),
    ).toBe("test")
    expect(fetch.mock.calls.map((call) => call[0])).toEqual([
      "/api/uploads/test",
      "/api/uploads/test/parts/2",
      "/api/uploads/test/complete",
    ])
    expect(progress).toHaveBeenLastCalledWith("test", 100)
  })
  it("rejects same-name same-size files whose confirmed part differs", async () => {
    const fetch = vi.fn().mockResolvedValueOnce(
      Response.json({
        upload,
        parts: [{ part_number: 1, sha256: await sha("abc"), size: 3 }],
      }),
    )
    vi.stubGlobal("fetch", fetch)
    await expect(
      uploadFile(
        new File(["xyzdef"], "a.txt"),
        "test",
        new AbortController().signal,
        vi.fn(),
      ),
    ).rejects.toThrow("不一致")
    expect(fetch).toHaveBeenCalledTimes(1)
  })
  it("does not complete after a pause request", async () => {
    const controller = new AbortController()
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ upload, parts: [] }))
      .mockImplementationOnce(async () => {
        controller.abort()
        return Response.json({ part: {} })
      })
    vi.stubGlobal("fetch", fetch)
    await expect(
      uploadFile(
        new File(["abcdef"], "a.txt"),
        "test",
        controller.signal,
        vi.fn(),
      ),
    ).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})

it("retries transient part failures without recreating the upload", async () => {
  vi.useFakeTimers()
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(policy))
    .mockResolvedValueOnce(Response.json({ upload, parts: [] }))
    .mockResolvedValueOnce(Response.json({ message: "busy" }, { status: 503 }))
    .mockResolvedValueOnce(Response.json({ part: {} }))
    .mockResolvedValueOnce(Response.json({ part: {} }))
    .mockResolvedValueOnce(Response.json({ file_id: "test", completed: true }))
  vi.stubGlobal("fetch", fetch)
  try {
    const pending = uploadFile(
      new File(["abcdef"], "a.txt"),
      undefined,
      new AbortController().signal,
      vi.fn(),
      "connection-test",
    )
    await vi.runAllTimersAsync()
    await expect(pending).resolves.toBe("test")
    expect(
      fetch.mock.calls.filter((c) => c[0] === "/api/uploads"),
    ).toHaveLength(1)
    expect(JSON.parse(fetch.mock.calls[1][1].body).storage_id).toBe(
      "connection-test",
    )
    expect(
      fetch.mock.calls.filter((c) => c[0] === "/api/uploads/test/parts/1"),
    ).toHaveLength(2)
  } finally {
    vi.useRealTimers()
  }
})

const policy = {
  min_part_size: 5 * 1024 ** 2,
  max_part_size: 16 * 1024 ** 2,
  default_part_size: 16 * 1024 ** 2,
  max_parts: 10000,
  max_file_size: 16 * 1024 ** 2 * 10000,
}
it("chooses sizes from device hints and respects server bounds and part count", () => {
  expect(selectPartSize(100, policy, {})).toBe(policy.default_part_size)
  expect(selectPartSize(100, policy, { deviceMemory: 2 })).toBe(
    policy.min_part_size,
  )
  expect(selectPartSize(100, policy, { hardwareConcurrency: 4 })).toBe(
    8 * 1024 ** 2,
  )
  expect(
    selectPartSize(policy.max_file_size, policy, { deviceMemory: 2 }),
  ).toBe(policy.max_part_size)
  expect(() => selectPartSize(policy.max_file_size + 1, policy, {})).toThrow()
})
