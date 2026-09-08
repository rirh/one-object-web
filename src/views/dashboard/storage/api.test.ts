import { afterEach, expect, it, vi } from "vitest"
import { getAccountCredentials } from "./api"

afterEach(() => vi.unstubAllGlobals())

it("loads stored credentials for the edit form", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValue(
      Response.json({ access_key: "access", secret_key: "secret" }),
    )
  vi.stubGlobal("fetch", fetch)

  await expect(getAccountCredentials("account/one")).resolves.toEqual({
    access_key: "access",
    secret_key: "secret",
  })
  expect(fetch).toHaveBeenCalledWith(
    "/api/storage/accounts/account%2Fone/credentials",
    expect.objectContaining({
      cache: "no-store",
      credentials: "same-origin",
    }),
  )
})
