import { afterEach, describe, expect, it, vi } from "vitest"
import { uploadFile } from "./api"
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
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
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
