import { afterEach, expect, it, vi } from "vitest"
import { refreshWithRotation } from "./refresh"
afterEach(() => vi.useRealTimers())
it("keeps fast refreshes pending for one rotation", async () => {
  vi.useFakeTimers()
  const finished = vi.fn()
  const result = refreshWithRotation(async () => "ok").then(finished)
  await vi.advanceTimersByTimeAsync(999)
  expect(finished).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  await result
  expect(finished).toHaveBeenCalledWith("ok")
})
it("waits for both the rotation and request, preserving failures", async () => {
  vi.useFakeTimers()
  const failure = new Error("offline")
  const finished = vi.fn()
  const result = refreshWithRotation(
    () => new Promise((_, reject) => setTimeout(() => reject(failure), 1500)),
  ).catch(finished)
  await vi.advanceTimersByTimeAsync(1000)
  expect(finished).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(500)
  await result
  expect(finished).toHaveBeenCalledWith(failure)
})
it("also completes the rotation after an immediate failure", async () => {
  vi.useFakeTimers()
  const failure = new Error("offline")
  const finished = vi.fn()
  const result = refreshWithRotation(async () => {
    throw failure
  }).catch(finished)
  await vi.advanceTimersByTimeAsync(999)
  expect(finished).not.toHaveBeenCalled()
  await vi.advanceTimersByTimeAsync(1)
  await result
  expect(finished).toHaveBeenCalledWith(failure)
})
