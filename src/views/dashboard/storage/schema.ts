import { z } from "zod"

export const connectionSchema = (editing: boolean, account = false) =>
  z
    .object({
      name: z
        .string()
        .trim()
        .min(1, "请输入名称")
        .max(100, "名称最多 100 个字符"),
      provider: z.enum(["r2", "aws", "aliyun", "tencent", "oci"]),
      bucket: z.string().trim(),
      region: z.string().trim(),
      account_id: z.string().trim(),
      access_key: z.string().trim(),
      secret_key: z.string(),
    })
    .superRefine((value, ctx) => {
      const error = (path: keyof typeof value, message: string) =>
        ctx.addIssue({ code: "custom", path: [path], message })
      if (!editing) {
        if (!account && !value.bucket) error("bucket", "请输入 Bucket")
        if (value.provider === "r2") {
          if (!/^[a-f0-9]{32}$/i.test(value.account_id))
            error("account_id", "请输入 32 位 Cloudflare Account ID")
        } else if ((!account || value.provider === "oci") && !value.region)
          error("region", "请输入区域")
      }
      if (
        !editing &&
        value.provider === "oci" &&
        !/^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/.test(value.account_id)
      )
        error("account_id", "请输入有效的 Object Storage Namespace")
      if (!editing || value.access_key || value.secret_key) {
        if (!value.access_key) error("access_key", "请输入访问密钥 ID")
        if (!value.secret_key.trim()) error("secret_key", "请输入访问密钥")
      }
    })
