// Keep the refresh indicator visible for at least one complete CSS rotation,
// including when the request fails immediately.
export async function refreshWithRotation<T>(refresh: () => Promise<T>) {
  const [result] = await Promise.allSettled([
    Promise.resolve().then(refresh),
    new Promise<void>((resolve) => setTimeout(resolve, 1000)),
  ])
  if (result.status === "rejected") throw result.reason
  return result.value
}
