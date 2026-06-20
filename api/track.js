// Logs EVERY event (lead, buy_click, whatsapp, social, reel, page_view) to OUR Airtable,
// so we have our own proof of every lead and buy-now click we send to Aly.
// Best-effort: never blocks the user, always returns 200.
// Env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, (optional) AIRTABLE_EVENTS_TABLE = "Events".
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(200).json({ ok: true });

  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_ACCESS_TOKEN;
    const base = process.env.AIRTABLE_BASE_ID;
    const table = process.env.AIRTABLE_EVENTS_TABLE || "Events";
    if (!token || !base) return res.status(200).json({ ok: true, stored: false }); // not configured yet

    const allowed = ["lead", "buy_click", "whatsapp", "social", "reel", "page_view"];
    const type = allowed.includes(b.type) ? b.type : "other";
    const fields = {
      Type: type,
      Source: String(b.source || "").slice(0, 120),
      Name: String(b.name || "").slice(0, 120),
      Email: String(b.email || "").slice(0, 160),
      Phone: String(b.phone || "").slice(0, 60),
      Path: String(b.path || "").slice(0, 200),
      Referrer: String(b.ref || "").slice(0, 300),
      UserAgent: String(req.headers["user-agent"] || "").slice(0, 300),
    };

    await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields, typecast: true }),
    });
    return res.status(200).json({ ok: true, stored: true });
  } catch (_) {
    return res.status(200).json({ ok: true, stored: false }); // never break the user flow
  }
};
