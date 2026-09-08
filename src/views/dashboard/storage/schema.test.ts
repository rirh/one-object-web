import { expect, it } from "vitest"
import { connectionSchema } from "./schema"

const input = {
  name: "test",
  provider: "r2",
  bucket: "bucket",
  region: "",
  account_id: "a".repeat(32),
  access_key: "key",
  secret_key: "secret",
}

it("validates the selected provider fields", () => {
  const schema = connectionSchema(false)
  expect(schema.safeParse(input).success).toBe(true)
  expect(schema.safeParse({ ...input, name: "hu_zhi_hui" }).success).toBe(true)
  expect(schema.safeParse({ ...input, account_id: "" }).success).toBe(false)
  expect(
    schema.safeParse({ ...input, provider: "aws", account_id: "" }).success,
  ).toBe(false)
  expect(
    schema.safeParse({
      ...input,
      provider: "aws",
      account_id: "",
      region: "us-east-1",
    }).success,
  ).toBe(true)
})
it("allows retaining credentials but requires both when rotating", () => {
  const schema = connectionSchema(true)
  expect(
    schema.safeParse({ ...input, access_key: "", secret_key: "" }).success,
  ).toBe(true)
  expect(schema.safeParse({ ...input, secret_key: "" }).success).toBe(false)
  expect(schema.safeParse({ ...input, name: "   " }).success).toBe(false)
})

it("allows a provider account without binding a bucket", () => {
  expect(
    connectionSchema(false, true).safeParse({ ...input, bucket: "" }).success,
  ).toBe(true)
  expect(
    connectionSchema(false).safeParse({ ...input, bucket: "" }).success,
  ).toBe(false)
})

it("requires OCI namespace and region for account creation", () => {
  const schema = connectionSchema(false, true)
  const oci = {
    ...input,
    provider: "oci",
    account_id: "mynamespace",
    region: "ap-singapore-1",
  }
  expect(schema.safeParse(oci).success).toBe(true)
  expect(schema.safeParse({ ...oci, account_id: "" }).success).toBe(false)
  expect(
    schema.safeParse({ ...oci, account_id: "evil.com/path" }).success,
  ).toBe(false)
  expect(schema.safeParse({ ...oci, region: "" }).success).toBe(false)
})

it("does not bind a vendor account to a required bucket region", () => {
  for (const provider of ["aws", "aliyun", "tencent"]) {
    expect(
      connectionSchema(false, true).safeParse({
        ...input,
        provider,
        region: "",
        bucket: "",
      }).success,
    ).toBe(true)
  }
})
