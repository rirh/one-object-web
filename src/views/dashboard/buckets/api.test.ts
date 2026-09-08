import { afterEach, expect, it, vi } from "vitest"
import { createBucket, deleteBucket, syncBuckets } from "./api"

afterEach(() => vi.unstubAllGlobals())
it("sends creation and exact deletion confirmation to the selected account", async () => {
  const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
  vi.stubGlobal("fetch", fetch)
  await createBucket("account-a", "my-bucket")
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/storage/accounts/account-a/buckets",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ bucket: "my-bucket" }),
    }),
  )
  await deleteBucket("account-a", "my-bucket", "my-bucket")
  expect(fetch).toHaveBeenLastCalledWith(
    "/api/storage/accounts/account-a/buckets/my-bucket",
    expect.objectContaining({
      method: "DELETE",
      body: JSON.stringify({ confirm_name: "my-bucket" }),
    }),
  )
})
it("does not turn failed cloud synchronization into an empty successful list", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "云端拒绝访问" }), {
        status: 502,
      }),
    ),
  )
  await expect(syncBuckets("account-a")).rejects.toThrow("云端拒绝访问")
})
