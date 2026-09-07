export function bytes(size: number) {
  if (size < 1024) return `${size} B`
  const index = Math.min(Math.floor(Math.log(size) / Math.log(1024)), 4)
  return `${(size / 1024 ** index).toFixed(1)} ${["B", "KiB", "MiB", "GiB", "TiB"][index]}`
}
export const date = (seconds: number) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(seconds * 1000))
