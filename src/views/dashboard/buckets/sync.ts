import type { QueryClient } from "@tanstack/react-query"
import { syncBuckets } from "./api"

export async function syncAndRefreshBuckets(
  client: QueryClient,
  accountId: string,
  canSync: boolean,
) {
  let syncError: unknown = null
  try {
    if (canSync) await syncBuckets(accountId)
  } catch (error) {
    syncError = error
  }
  await Promise.all(
    [
      "storage-buckets",
      "storage-connections",
      "storage-accounts",
      "storage-objects",
    ].map((key) =>
      client.invalidateQueries({
        queryKey: key === "storage-buckets" ? [key, accountId] : [key],
      }),
    ),
  )
  return syncError
}

export async function syncBucketsWithAnimation(accountId: string) {
  const [result] = await Promise.allSettled([
    syncBuckets(accountId),
    new Promise<void>((resolve) => setTimeout(resolve, 1000)),
  ])
  if (result.status === "rejected") throw result.reason
  return result.value
}
