import { getRequestContext } from "@cloudflare/next-on-pages";

export interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
}

export function getEnv(): CloudflareEnv {
  return getRequestContext().env as CloudflareEnv;
}
