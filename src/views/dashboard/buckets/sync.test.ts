import { QueryClient } from "@tanstack/react-query"
import { afterEach, expect, it, vi } from "vitest"
import { syncBuckets } from "./api"
import { syncAndRefreshBuckets, syncBucketsWithAnimation } from "./sync"

vi.mock("./api", () => ({ syncBuckets: vi.fn() }))
afterEach(() => {
  vi.useRealTimers()
  vi.resetAllMocks()
})

it("refreshes related lists only after cloud synchronization completes", async () => {
  const client = new QueryClient()
  const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue()
  let complete!: (result: { count: number }) => void
  vi.mocked(syncBuckets).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve
      }),
  )
  const pending = syncAndRefreshBuckets(client, "account-a", true)
  expect(invalidate).not.toHaveBeenCalled()
  complete({ count: 2 })
  expect(await pending).toBeNull()
  expect(syncBuckets).toHaveBeenCalledWith("account-a")
  expect(invalidate.mock.calls.map(([options]) => options?.queryKey)).toEqual([
    ["storage-buckets", "account-a"],
    ["storage-connections"],
    ["storage-accounts"],
    ["storage-objects"],
  ])
})

it("still refreshes completed changes and reports a sync failure separately", async () => {
  const client = new QueryClient()
  const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue()
  const error = new Error("cloud unavailable")
  vi.mocked(syncBuckets).mockRejectedValue(error)
  expect(await syncAndRefreshBuckets(client, "account-a", true)).toBe(error)
  expect(invalidate).toHaveBeenCalledTimes(4)
})

it("does not request cloud synchronization without permission", async () => {
  const client = new QueryClient()
  vi.spyOn(client, "invalidateQueries").mockResolvedValue()
  await syncAndRefreshBuckets(client, "account-a", false)
  expect(syncBuckets).not.toHaveBeenCalled()
})

it.each([true, false])(
  "keeps fast sync feedback pending for one full second (success: %s)",
  async (success) => {
    vi.useFakeTimers()
    const error = new Error("sync failed")
    vi.mocked(syncBuckets).mockImplementation(() =>
      success ? Promise.resolve({ count: 3 }) : Promise.reject(error),
    )
    const settled = vi.fn()
    const pending = syncBucketsWithAnimation("account-a").then(settled, settled)
    await vi.advanceTimersByTimeAsync(999)
    expect(settled).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await pending
    expect(settled).toHaveBeenCalledWith(success ? { count: 3 } : error)
  },
)

it("continues waiting when cloud sync takes longer than the animation", async () => {
  vi.useFakeTimers()
  let complete!: (result: { count: number }) => void
  vi.mocked(syncBuckets).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve
      }),
  )
  const settled = vi.fn()
  const pending = syncBucketsWithAnimation("account-a").then(settled)
  await vi.advanceTimersByTimeAsync(1500)
  expect(settled).not.toHaveBeenCalled()
  complete({ count: 5 })
  await pending
  expect(settled).toHaveBeenCalledWith({ count: 5 })
})
