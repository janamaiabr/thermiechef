// Aggregates our tracked events for the private dashboard. Protected by DASHBOARD_KEY.
// Env: AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_EVENTS_TABLE="Events", DASHBOARD_KEY.
module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-dash-key");
  if (req.method === "OPTIONS") return res.status(200).end();

  const key = req.headers["x-dash-key"] || (req.query && req.query.key);
  if (!process.env.DASHBOARD_KEY || key !== process.env.DASHBOARD_KEY)
    return res.status(401).json({ error: "Unauthorized" });

  const token = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_ACCESS_TOKEN;
  const base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_EVENTS_TABLE || "Events";
  if (!token || !base) return res.status(200).json({ configured: false, totals: {}, bySource: {}, recentLeads: [] });

  try {
    // pull all events (paginated)
    let records = [], offset;
    do {
      const url = new URL(`https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`);
      url.searchParams.set("pageSize", "100");
      if (offset) url.searchParams.set("offset", offset);
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const j = await r.json();
      records = records.concat(j.records || []);
      offset = j.offset;
    } while (offset && records.length < 5000);

    const totals = { lead: 0, buy_click: 0, whatsapp: 0, social: 0, reel: 0, page_view: 0 };
    const bySource = {};
    const leads = [];
    for (const rec of records) {
      const f = rec.fields || {};
      const t = f.Type || "other";
      if (totals[t] !== undefined) totals[t]++;
      if (t === "buy_click") { const s = f.Source || "—"; bySource[s] = (bySource[s] || 0) + 1; }
      if (t === "lead") leads.push({ name: f.Name || "", email: f.Email || "", phone: f.Phone || "", source: f.Source || "", date: rec.createdTime });
    }
    leads.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    const convRate = totals.lead ? Math.round((totals.buy_click / totals.lead) * 100) : 0;
    return res.status(200).json({
      configured: true,
      totals,
      conversionPct: convRate,
      bySource,
      recentLeads: leads.slice(0, 50),
      totalLeads: leads.length,
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    return res.status(500).json({ error: "Could not load stats" });
  }
};
