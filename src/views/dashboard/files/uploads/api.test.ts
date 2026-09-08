import { afterEach, describe, expect, it, vi } from "vitest"
import { uploadFile, selectPartSize, shouldUseSingleUpload } from "./api"
vi.mock("./upload-part", async () => {
  const { request } = await import("@/lib/http")
  return {
    uploadPart: (
      path: string,
      body: Blob,
      signal: AbortSignal,
      onProgress: (sent: number) => void,
      onSent: () => void,
    ) => {
      onProgress(body.size)
      onSent()
      return request(path, { method: "PUT", body, signal })
    },
  }
})
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
    vi.unstubAllGlobals()
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

it("reuses verified existing content without creating or sending parts", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(policy))
    .mockResolvedValueOnce(
      Response.json({
        upload: { ...upload, id: "existing", status: "completed" },
        parts: [],
      }),
    )
  vi.stubGlobal("fetch", fetch)
  const progress = vi.fn()
  const instant = vi.fn()
  await expect(
    uploadFile(
      new File(["abcdef"], "a.txt"),
      undefined,
      new AbortController().signal,
      progress,
      "bucket",
      undefined,
      instant,
    ),
  ).resolves.toBe("existing")
  expect(fetch.mock.calls.map((call) => call[0])).toEqual([
    "/api/uploads/policy",
    "/api/uploads",
  ])
  expect(JSON.parse(fetch.mock.calls[1][1].body).hashes).toEqual([
    await sha("abcdef"),
  ])
  expect(instant).toHaveBeenCalledOnce()
  expect(progress).toHaveBeenLastCalledWith("existing", 100)
})

it("stops before reuse or creation when paused during hashing", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(policy))
  vi.stubGlobal("fetch", fetch)
  const controller = new AbortController()
  await expect(
    uploadFile(
      new File(["abcdef"], "a.txt"),
      undefined,
      controller.signal,
      vi.fn(),
      "bucket",
      () => controller.abort(),
    ),
  ).rejects.toThrow()
  expect(fetch).toHaveBeenCalledTimes(1)
})

it("verifies content even when a lost completion response left the task completed", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(
    Response.json({
      upload: { ...upload, status: "completed" },
      parts: [
        { part_number: 1, sha256: await sha("abc"), size: 3 },
        { part_number: 2, sha256: await sha("def"), size: 3 },
      ],
    }),
  )
  vi.stubGlobal("fetch", fetch)
  await expect(
    uploadFile(
      new File(["abcdef"], "a.txt"),
      "test",
      new AbortController().signal,
      vi.fn(),
    ),
  ).resolves.toBe("test")
  expect(fetch).toHaveBeenCalledTimes(1)
})

it("checks later confirmed parts before filling an earlier missing part", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(
    Response.json({
      upload,
      parts: [{ part_number: 2, sha256: await sha("def"), size: 3 }],
    }),
  )
  vi.stubGlobal("fetch", fetch)
  await expect(
    uploadFile(
      new File(["abcXYZ"], "a.txt"),
      "test",
      new AbortController().signal,
      vi.fn(),
    ),
  ).rejects.toThrow("不一致")
  expect(fetch).toHaveBeenCalledTimes(1)
})

it("sends confirmed hashes to creation and accepts a concurrent instant-upload hit", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(Response.json(policy))
    .mockResolvedValueOnce(
      Response.json({
        upload: {
          ...upload,
          original_filename: "original.txt",
          status: "completed",
        },
        parts: [],
      }),
    )
  vi.stubGlobal("fetch", fetch)
  const instant = vi.fn()
  await expect(
    uploadFile(
      new File(["abcdef"], "renamed.txt"),
      undefined,
      new AbortController().signal,
      vi.fn(),
      "bucket",
      undefined,
      instant,
    ),
  ).resolves.toBe("test")
  expect(JSON.parse(fetch.mock.calls[1][1].body).hashes).toEqual([
    await sha("abcdef"),
  ])
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(instant).toHaveBeenCalledOnce()
})

it("passes the selected folder including root without altering the file name", async () => {
  for (const prefix of ["", "报告 + draft/"]) {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json(policy))
      .mockResolvedValueOnce(
        Response.json({
          upload: { ...upload, status: "completed" },
          parts: [],
        }),
      )
    vi.stubGlobal("fetch", fetch)
    await uploadFile(
      new File(["abcdef"], "a.txt"),
      undefined,
      new AbortController().signal,
      vi.fn(),
      "selected-bucket",
      undefined,
      undefined,
      prefix,
    )
    expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
      storage_id: "selected-bucket",
      prefix,
      original_filename: "a.txt",
    })
  }
})

it("uploads ordinary files with one content request and no part/complete requests", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ ...policy, multipart_threshold: 100_000_000 }),
    )
    .mockResolvedValueOnce(
      Response.json({ upload: { ...upload, method: "single" }, parts: [] }),
    )
    .mockResolvedValueOnce(Response.json({ completed: true, file_id: "test" }))
  vi.stubGlobal("fetch", fetch)
  const file = new File(["abcdef"], "a.txt")
  await uploadFile(
    file,
    undefined,
    new AbortController().signal,
    vi.fn(),
    "bucket",
    undefined,
    undefined,
    "folder/",
  )
  expect(JSON.parse(fetch.mock.calls[1][1].body)).toMatchObject({
    single: true,
    prefix: "folder/",
  })
  expect(fetch.mock.calls.map((call) => call[0])).toEqual([
    "/api/uploads/policy",
    "/api/uploads",
    "/api/uploads/test/content",
  ])
  expect(fetch.mock.calls[2][1]).toMatchObject({ method: "PUT", body: file })
})

it("retries an ordinary upload with the entire file after a pause", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({
        upload: { ...upload, method: "single" },
        parts: [
          { part_number: 1, sha256: await sha("abc"), size: 3 },
          { part_number: 2, sha256: await sha("def"), size: 3 },
        ],
      }),
    )
    .mockResolvedValueOnce(Response.json({ completed: true, file_id: "test" }))
  vi.stubGlobal("fetch", fetch)
  const file = new File(["abcdef"], "a.txt")
  await uploadFile(file, "test", new AbortController().signal, vi.fn())
  expect(fetch.mock.calls[1][0]).toBe("/api/uploads/test/content")
  expect(fetch.mock.calls[1][1].body).toBe(file)
})

it("switches to multipart at exactly 100 MB", () => {
  expect(shouldUseSingleUpload(1)).toBe(true)
  expect(shouldUseSingleUpload(99_999_999)).toBe(true)
  expect(shouldUseSingleUpload(100_000_000)).toBe(false)
})
