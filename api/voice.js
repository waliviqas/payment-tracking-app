// POST /api/voice — turn a spoken sentence into a structured expense via OpenAI,
// then save it to the database so the app shows it.
// Body: { text: "fifty bucks on groceries today, weekly shop" }
// Header: x-app-token: <APP_SECRET>
import { getRedis } from "../lib/redis.js";

const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Bills",
  "Other",
  "Gas",
  "Travel",
  "Subscription",
  "Credit Card Payment",
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  // Shared-secret gate — keeps randoms from spending your OpenAI credit.
  if (req.headers["x-app-token"] !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const text = ((req.body && req.body.text) || "").toString().trim();
  if (!text) return res.status(400).json({ error: "no text provided" });

  const redis = getRedis();
  if (!redis) return res.status(503).json({ error: "database not set up yet" });

  // Use the user's actual categories if present, else the defaults.
  const cats = (await redis.get("categories")) || CATEGORIES;

  // "Today" in the user's local time (Eastern), with an optional override the
  // Shortcut can pass so it's always correct even when traveling.
  const bodyToday = ((req.body && req.body.today) || "").toString();
  const today = /^\d{4}-\d{2}-\d{2}$/.test(bodyToday)
    ? bodyToday
    : new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const system = [
    "You convert a short spoken sentence about a purchase into JSON.",
    `Today is ${today}.`,
    `Choose category from EXACTLY this list: ${cats.join(", ")}. If none clearly fits, use "Other".`,
    'Return ONLY JSON shaped: {"amount": number, "category": string, "date": "YYYY-MM-DD", "notes": string}.',
    "amount is a positive number. date defaults to today unless the sentence says otherwise (e.g. 'yesterday', 'June 5'). notes holds extra detail like the store or item; empty string if none.",
  ].join(" ");

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: text },
        ],
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(502).json({ error: "openai request failed", detail });
    }

    const data = await r.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    const expense = {
      id: (globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2)),
      amount: Number(parsed.amount),
      category: parsed.category || "Other",
      date: parsed.date || today,
      notes: parsed.notes || "",
    };

    // Save: prepend to the expenses list, and add the category if it's new.
    const current = (await redis.get("expenses")) || [];
    await redis.set("expenses", [expense, ...current]);
    if (!cats.includes(expense.category)) {
      await redis.set("categories", [...cats, expense.category]);
    }

    return res.status(200).json(expense);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
