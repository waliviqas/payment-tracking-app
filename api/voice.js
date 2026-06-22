// POST /api/voice — turn a spoken sentence into a structured expense via OpenAI.
// Body: { text: "fifty bucks on groceries today, weekly shop" }
// Header: x-app-token: <APP_SECRET>   (so only your Shortcut can use your key)
// Returns: { amount, category, date, notes }

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

  const today = new Date().toISOString().slice(0, 10);
  const system = [
    "You convert a short spoken sentence about a purchase into JSON.",
    `Today is ${today}.`,
    `Choose category from EXACTLY this list: ${CATEGORIES.join(", ")}. If none clearly fits, use "Other".`,
    'Return ONLY JSON shaped: {"amount": number, "category": string, "date": "YYYY-MM-DD", "notes": string}.',
    "amount is a positive number. date defaults to today unless the sentence says otherwise (e.g. 'yesterday', 'June 5'). notes holds any extra detail like the store or item; use an empty string if none.",
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

    // NOTE: next step saves this to the database (once you've created it in Vercel).
    return res.status(200).json(parsed);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
