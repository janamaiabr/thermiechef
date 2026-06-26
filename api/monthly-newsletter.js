// api/monthly-newsletter.js
// Monthly ThermieChef newsletter. Protected by CRON_SECRET.
// Sends only when NEWSLETTER_SEND_ENABLED=true is configured.

const SITE_URL = "https://thermiechef.com.au";
const BUY_THERMOMIX_URL =
  "https://thermomix.com.au/cart/update?attributes%5Bconsultant_id%5D=63072158&attributes%5Bsource%5D=online_bb&updates%5B45183405719729%5D=1";

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
  const buyUrl = BUY_THERMOMIX_URL.replace(/&/g, "&amp;");
  const month = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric", timeZone: "Australia/Brisbane" }).format(date);
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>ThermieChef monthly recipes</title></head>
<body style="margin:0;background:#f6efe6;color:#2d2418;font-family:Arial,'Helvetica Neue',sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Aly's monthly Thermomix edit: three recipes, one useful rhythm, and no weeknight fuss.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6efe6;">
    <tr><td align="center" style="padding:32px 14px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:660px;background:#fffaf3;border-radius:24px;overflow:hidden;border:1px solid #ead8c3;">
        <tr><td>
          <img src="${SITE_URL}/assets/hero-table.jpg" alt="ThermieChef recipes" width="660" style="display:block;width:100%;height:auto;border:0;">
        </td></tr>
        <tr><td style="padding:32px 32px 16px;">
          <p style="color:#c76824;letter-spacing:2.4px;font-size:12px;text-transform:uppercase;margin:0 0 14px;font-weight:700;">ThermieChef · ${month}</p>
          <h1 style="font-size:38px;line-height:1.08;margin:0 0 14px;color:#2d2418;letter-spacing:0;">Three recipes for a calmer Thermomix month.</h1>
          <p style="font-size:18px;line-height:1.62;color:#675647;margin:0;">A small edit from Aly: one quick dinner, one batch-friendly bowl, and one sweet thing for the weekend bench.</p>
        </td></tr>
        <tr><td style="padding:10px 32px 8px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td width="32%" valign="top" style="background:#ffffff;border:1px solid #ead8c3;border-radius:16px;overflow:hidden;">
                <img src="${SITE_URL}/assets/recipes/broccoli-orecchiette-jamie-oliver.jpg" alt="Broccoli orecchiette" width="188" style="display:block;width:100%;height:auto;border:0;">
                <div style="padding:14px 13px 16px;">
                  <p style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c76824;margin:0 0 8px;font-weight:700;">Weeknight</p>
                  <p style="font-size:16px;line-height:1.3;margin:0;color:#2d2418;font-weight:700;">Broccoli Orecchiette</p>
                </div>
              </td>
              <td width="2%"></td>
              <td width="32%" valign="top" style="background:#ffffff;border:1px solid #ead8c3;border-radius:16px;overflow:hidden;">
                <img src="${SITE_URL}/assets/recipes/coconut-pumpkin-curry-madhur-jaffrey.jpg" alt="Coconut pumpkin curry" width="188" style="display:block;width:100%;height:auto;border:0;">
                <div style="padding:14px 13px 16px;">
                  <p style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c76824;margin:0 0 8px;font-weight:700;">Batch cook</p>
                  <p style="font-size:16px;line-height:1.3;margin:0;color:#2d2418;font-weight:700;">Coconut Pumpkin Curry</p>
                </div>
              </td>
              <td width="2%"></td>
              <td width="32%" valign="top" style="background:#ffffff;border:1px solid #ead8c3;border-radius:16px;overflow:hidden;">
                <img src="${SITE_URL}/assets/recipes/chocolate-olive-oil-cake-nigella.jpg" alt="Chocolate olive oil cake" width="188" style="display:block;width:100%;height:auto;border:0;">
                <div style="padding:14px 13px 16px;">
                  <p style="font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#c76824;margin:0 0 8px;font-weight:700;">Weekend</p>
                  <p style="font-size:16px;line-height:1.3;margin:0;color:#2d2418;font-weight:700;">Chocolate Olive Oil Cake</p>
                </div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 34px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#2d2418;border-radius:18px;">
            <tr><td style="padding:24px 26px;">
              <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#f2b36f;margin:0 0 10px;font-weight:700;">Aly's Thermomix rhythm</p>
              <p style="font-size:17px;line-height:1.58;color:#fffaf3;margin:0 0 20px;">Chop aromatics, scrape down, saute, then build the sauce. Once that base feels automatic, dinner stops feeling like a fresh decision every night.</p>
              <a href="${SITE_URL}/recipes/?utm_source=newsletter&utm_medium=email&utm_campaign=${campaign}" style="display:inline-block;background:#e87d2f;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Browse this month's recipes</a>
            </td></tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fff3e5;border:1px solid #ead8c3;border-radius:18px;margin-top:18px;">
            <tr><td style="padding:22px 24px;">
              <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#c76824;margin:0 0 9px;font-weight:700;">Ready for your own Thermomix?</p>
              <p style="font-size:17px;line-height:1.55;color:#4e4135;margin:0 0 18px;">Buy through Aly's official consultant link, or reply and ask her which option makes sense for your kitchen.</p>
              <a href="${buyUrl}" style="display:inline-block;background:#e87d2f;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:999px;font-weight:700;">Buy your Thermomix</a>
            </td></tr>
          </table>
          <p style="font-size:12px;line-height:1.6;color:#8b7a68;margin:24px 0 0;text-align:center;">You received this because you asked ThermieChef for recipes or updates. <a href="${unsubscribe}" style="color:#c76824;">Unsubscribe</a>.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
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
