import { expect, it } from "vitest"
import { buildSkill, endpoints, setupExample } from "./content"

it("uses the current origin in the downloadable skill without credentials", () => {
  const skill = buildSkill("https://object.example:8443/guide")
  expect(skill).toContain("Base URL: https://object.example:8443")
  expect(skill).toContain("https://object.example:8443/guide")
  expect(skill).toContain("name: one-object")
  expect(skill).not.toContain("ook_")
  expect(setupExample("http://localhost:27525/guide")).toContain(
    "'http://localhost:27525'",
  )
})

it("documents application-compatible upload parameters and actual response shapes", () => {
  for (const endpoint of endpoints) expect(endpoint.example).not.toMatch(/\n\+/)
  expect(
    endpoints
      .find((endpoint) => endpoint.id === "upload")
      ?.parameters.some(([name]) => name === "prefix"),
  ).toBe(false)
  expect(
    JSON.parse(endpoints.find((endpoint) => endpoint.id === "abort")!.response),
  ).toEqual({ status: "aborted" })
  const policy = JSON.parse(
    endpoints.find((endpoint) => endpoint.id === "policy")!.response,
  )
  expect(policy.max_part_size).toBe(16 * 1024 * 1024)
})
