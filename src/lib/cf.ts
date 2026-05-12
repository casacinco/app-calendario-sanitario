import { getRequestContext } from "@cloudflare/next-on-pages";

export interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  HOTMART_WEBHOOK_SECRET?: string;
}

export function getEnv(): CloudflareEnv {
  return getRequestContext().env as CloudflareEnv;
}
