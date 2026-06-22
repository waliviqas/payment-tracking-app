// /api/data — the app's cloud store.
//   GET  -> { expenses, categories }
//   POST -> save { expenses, categories }   (the app sends its full state)
import { getRedis } from "../lib/redis.js";

export default async function handler(req, res) {
  const redis = getRedis();

  if (req.method === "GET") {
    if (!redis) return res.status(200).json({ expenses: [], categories: null });
    const [expenses, categories] = await Promise.all([
      redis.get("expenses"),
      redis.get("categories"),
    ]);
    return res.status(200).json({
      expenses: expenses || [],
      categories: categories || null, // null => app keeps its defaults
    });
  }

  if (req.method === "POST" || req.method === "PUT") {
    if (!redis) return res.status(200).json({ ok: true, nodb: true });
    const { expenses, categories } = req.body || {};
    const ops = [];
    if (Array.isArray(expenses)) ops.push(redis.set("expenses", expenses));
    if (Array.isArray(categories)) ops.push(redis.set("categories", categories));
    await Promise.all(ops);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method not allowed" });
}
