import { request } from "@/lib/http"

// Fetch exposes no upload byte events. Report only server-confirmed progress.
export async function uploadPart(
  path: string,
  body: Blob,
  signal: AbortSignal,
  onProgress: (sent: number) => void,
  onSent: () => void,
) {
  signal.throwIfAborted()
  await request(path, {
    method: "PUT",
    body,
    signal,
    headers: { "Content-Type": "application/octet-stream" },
  })
  onProgress(body.size)
  onSent()
}
