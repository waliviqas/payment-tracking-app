import { Redis } from "@upstash/redis";

// Returns a Redis client, or null if no database is configured yet.
// Reads whichever env-var names Vercel/Upstash injected.
export function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
