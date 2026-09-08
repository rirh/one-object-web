import { describe, expect, it } from "vitest"
import { translateObject } from "./object"
import { objectEnglish } from "./object-messages"

describe("Object translations", () => {
  it("uses the selected language and preserves unknown provider/user data", () => {
    expect(translateObject("zh-CN", "上传文件")).toBe("上传文件")
    expect(translateObject("en-US", "上传文件")).toBe("Upload files")
    expect(translateObject("en-US", "constructor")).toBe("constructor")
    expect(translateObject("en-US", "客户自己的文件名.pdf")).toBe(
      "客户自己的文件名.pdf",
    )
  })

  it("interpolates values once without interpreting replacement characters", () => {
    expect(translateObject("en-US", "暂停 {0}", { 0: "$&{1}.txt" })).toBe(
      "Pause $&{1}.txt",
    )
    expect(translateObject("zh-CN", "当前页 {0} 项", { 0: 0 })).toBe(
      "当前页 0 项",
    )
  })

  it("translates ongoing upload stages at render time", () => {
    expect(translateObject("en-US", "校验 57%")).toBe("Verifying 57%")
    expect(translateObject("en-US", "传输分片 2/9")).toBe("Uploading part 2/9")
    expect(translateObject("en-US", "等待云端确认 2/9")).toBe(
      "Waiting for cloud confirmation 2/9",
    )
    expect(translateObject("en-US", "请求失败（503）")).toBe(
      "Request failed (503)",
    )
    expect(translateObject("zh-CN", "传输分片 2/9")).toBe("传输分片 2/9")
  })

  it("keeps interpolation parameters intact in every English message", () => {
    const params = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
    for (const [source, english] of Object.entries(objectEnglish)) {
      expect(english.trim(), source).not.toBe("")
      expect(params(english), source).toEqual(params(source))
    }
  })
})
