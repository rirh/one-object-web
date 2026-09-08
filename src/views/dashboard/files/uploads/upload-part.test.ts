import { afterEach, expect, it, vi } from "vitest"
import { uploadPart } from "./upload-part"
afterEach(() => vi.unstubAllGlobals())
it("reports only server-confirmed bytes through fetch", async () => {
  let finish!: (response: Response) => void
  const fetch = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        finish = resolve
      }),
  )
  vi.stubGlobal("fetch", fetch)
  const progress = vi.fn(),
    sent = vi.fn()
  const body = new Blob(["abcdef"])
  const pending = uploadPart(
    "/part",
    body,
    new AbortController().signal,
    progress,
    sent,
  )
  expect(progress).not.toHaveBeenCalled()
  expect(fetch.mock.calls[0]).toBeDefined()
  finish(new Response(null, { status: 204 }))
  await pending
  expect(progress).toHaveBeenCalledWith(6)
  expect(sent).toHaveBeenCalledOnce()
})
it("does not send an aborted upload and preserves provider errors", async () => {
  const fetch = vi.fn(async () =>
    Response.json({ message: "没有上传权限" }, { status: 403 }),
  )
  vi.stubGlobal("fetch", fetch)
  const controller = new AbortController()
  controller.abort()
  await expect(
    uploadPart("/part", new Blob(["x"]), controller.signal, vi.fn(), vi.fn()),
  ).rejects.toMatchObject({ name: "AbortError" })
  expect(fetch).not.toHaveBeenCalled()
  await expect(
    uploadPart(
      "/part",
      new Blob(["x"]),
      new AbortController().signal,
      vi.fn(),
      vi.fn(),
    ),
  ).rejects.toMatchObject({ status: 403, message: "没有上传权限" })
})
