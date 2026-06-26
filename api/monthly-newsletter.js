// api/monthly-newsletter.js
// Monthly ThermieChef newsletter. Protected by CRON_SECRET.
// Sends only when NEWSLETTER_SEND_ENABLED=true is configured.

const SITE_URL = "https://thermiechef.com.au";

function isAuthorized(req) {
  const expected = process.env.CRON_SECRET;
  if (!expected) return false;
  const auth = req.headers.authorization || "";
  const key = req.headers["x-admin-key"] || (req.query && req.query.key);
  return auth === `Bearer ${expected}` || key === expected;
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

async function airtableList(table) {
  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_ACCESS_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) throw new Error("Airtable not configured");

  const records = [];
  let offset = "";
  do {
    const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await response.json();
    if (!response.ok) throw new Error(`Airtable ${response.status}: ${JSON.stringify(json).slice(0, 300)}`);
    records.push(...(json.records || []));
    offset = json.offset || "";
  } while (offset && records.length < 5000);
  return records;
}

async function airtableCreate(table, fields) {
  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_ACCESS_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!token || !base) return;
  await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields, typecast: true }),
  }).catch(() => {});
}

async function collectSubscribers() {
  const table = process.env.AIRTABLE_EVENTS_TABLE || "Events";
  const emails = new Set();
  const unsubscribed = new Set();
  let records = [];
  try {
    records = await airtableList(table);
  } catch (err) {
    console.warn("[newsletter] Airtable unavailable:", err.message);
    return [];
  }

  for (const record of records) {
    const fields = record.fields || {};
    const email = normalizeEmail(fields.Email);
    const type = String(fields.Type || "").toLowerCase();
    const source = String(fields.Source || "").toLowerCase();
    if (!email) continue;
    if (type === "unsubscribe" || source === "newsletter_unsubscribe") unsubscribed.add(email);
    if (type === "lead" && source === "newsletter") emails.add(email);
  }

  for (const email of unsubscribed) emails.delete(email);
  return [...emails].sort();
}

function renderEmail({ email, date = new Date() }) {
  const campaign = `thermiechef-${monthKey(date)}`;
  const unsubscribe = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  const month = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "Australia/Brisbane" }).format(date);
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>ThermieChef monthly recipes</title></head>
<body style="margin:0;background:#fffaf3;color:#2d2418;font-family:Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:34px 22px;">
    <p style="color:#d5752b;letter-spacing:2px;font-size:12px;text-transform:uppercase;margin:0 0 18px;font-weight:700;">ThermieChef · Monthly recipes</p>
    <img src="${SITE_URL}/assets/hero-table.jpg" alt="ThermieChef recipes" style="display:block;width:100%;max-width:640px;border:0;border-radius:18px;margin:0 0 24px;">
    <h1 style="font-size:34px;line-height:1.12;margin:0 0 10px;color:#2d2418;">Three easy Thermomix dinners for ${month}</h1>
    <p style="font-size:18px;line-height:1.65;color:#5f5042;margin:0 0 24px;">A small monthly edit from Aly: practical recipes, simple Thermomix settings, and one useful kitchen rhythm to make dinner feel lighter.</p>
    <div style="background:#ffffff;border:1px solid #f0dfcc;border-radius:14px;padding:20px;margin:20px 0;">
      <h2 style="font-size:22px;margin:0 0 12px;color:#2d2418;">Cook this month</h2>
      <ul style="font-size:16px;line-height:1.7;color:#4e4135;margin:0;padding-left:20px;">
        <li>One quick pasta for a tired weeknight.</li>
        <li>One soup or curry you can batch for leftovers.</li>
        <li>One sweet bake for the weekend bench.</li>
      </ul>
      <p style="margin:18px 0 0;"><a href="${SITE_URL}/recipes/?utm_source=newsletter&utm_medium=email&utm_campaign=${campaign}" style="display:inline-block;background:#e87d2f;color:white;text-decoration:none;padding:13px 20px;border-radius:999px;font-weight:700;">Browse this month's recipes</a></p>
    </div>
    <div style="background:#fff3e5;border-radius:14px;padding:18px;margin:24px 0;">
      <strong style="display:block;margin-bottom:8px;color:#2d2418;">Aly's Thermomix tip</strong>
      <p style="font-size:16px;line-height:1.65;margin:0;color:#5f5042;">Save your most-used base steps as a tiny routine: chop aromatics, scrape down, saute, then build the sauce. The machine feels faster when your brain is not deciding from scratch every night.</p>
    </div>
    <p style="font-size:13px;line-height:1.6;color:#8b7a68;margin:28px 0 0;">You received this because you asked ThermieChef for recipes or updates. <a href="${unsubscribe}" style="color:#d5752b;">Unsubscribe</a>.</p>
  </div>
</body></html>`;
}

async function sendEmail({ to, html }) {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) throw new Error("RESEND_API_KEY not configured");
  const unsubscribe = `${SITE_URL}/api/unsubscribe?email=${encodeURIComponent(to)}`;
  const from = process.env.NEWSLETTER_FROM || "ThermieChef <noreply@thermiechef.com.au>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Three easy Thermomix dinners this month",
      html,
      headers: { "List-Unsubscribe": `<${unsubscribe}>` },
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json().catch(() => ({}));
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-admin-key");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (!isAuthorized(req)) return res.status(401).json({ error: "unauthorized" });

  const subscribers = await collectSubscribers();
  const enabled = process.env.NEWSLETTER_SEND_ENABLED === "true";
  const force = req.query.force === "1";
  const preview = req.query.preview === "1" || req.query.dry === "1" || !enabled;
  const sampleEmail = normalizeEmail(req.query.email) || subscribers[0] || "preview@example.com";
  const html = renderEmail({ email: sampleEmail });

  if (preview && !force) {
    return res.status(200).json({
      ok: true,
      brand: "thermiechef",
      mode: "preview",
      sendEnabled: enabled,
      subscriberCount: subscribers.length,
      subject: "Three easy Thermomix dinners this month",
      html,
    });
  }

  const results = [];
  for (const email of subscribers) {
    try {
      const sent = await sendEmail({ to: email, html: renderEmail({ email }) });
      results.push({ email, ok: true, id: sent.id || "" });
    } catch (err) {
      results.push({ email, ok: false, error: err.message });
    }
  }

  await airtableCreate(process.env.AIRTABLE_EVENTS_TABLE || "Events", {
    Type: "newsletter_send",
    Source: "monthly",
    Email: "",
    Path: "/api/monthly-newsletter",
  });

  return res.status(200).json({
    ok: true,
    brand: "thermiechef",
    mode: "sent",
    subscriberCount: subscribers.length,
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
};
