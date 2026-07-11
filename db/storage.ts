import { env } from "cloudflare:workers";

export function getFileBucket(): R2Bucket {
  const bucket = (env as unknown as { FILES?: R2Bucket }).FILES;
  if (!bucket) throw new Error("Cloudflare R2 binding `FILES` is unavailable");
  return bucket;
}
