// api/unsubscribe.js
// One-click newsletter unsubscribe for ThermieChef.

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

async function airtableCreate(fields) {
  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_ACCESS_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_EVENTS_TABLE || "Events";
  if (!token || !base) return;
  await fetch(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields, typecast: true }),
  }).catch(() => {});
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  const email = normalizeEmail(req.query.email || (req.body && req.body.email));
  if (!email) return res.status(400).send("Invalid email.");

  await airtableCreate({
    Type: "unsubscribe",
    Source: "newsletter_unsubscribe",
    Email: email,
    Path: "/api/unsubscribe",
  });

  return res.status(200).send(`<!doctype html>
<meta charset="utf-8">
<body style="font-family:Arial,sans-serif;background:#fffaf3;color:#2d2418;padding:40px">
  <h1>You're unsubscribed.</h1>
  <p>${email} will no longer receive ThermieChef monthly recipes.</p>
</body>`);
};
