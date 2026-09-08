import { expect, it } from "vitest"
import { isImageFile, objectDownloadHref } from "./links"
it("recognizes image names case-insensitively without treating archives as images", () => {
  expect(isImageFile("photo.PNG")).toBe(true)
  expect(isImageFile("icon.svg")).toBe(true)
  expect(isImageFile("image.png.zip")).toBe(false)
  expect(isImageFile("object", "image/jpeg")).toBe(true)
})
it("encodes the exact object key in authenticated download URLs", () => {
  const key = "图片/100% + #1.png"
  const download = new URL(
    objectDownloadHref("connection-5", key),
    "http://localhost",
  )
  expect(download.pathname).toBe("/api/files/objects/download")
  expect(download.searchParams.get("key")).toBe(key)
  expect(download.searchParams.get("storage_id")).toBe("connection-5")
})
