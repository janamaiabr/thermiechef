// Prints how many recipes are still queued (datePublished in the future).
// Used by the daily workflow to email an alert when the queue runs low.
// `node scripts/queue-status.mjs` -> prints just the integer count.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "recipes", "data");
const TODAY = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
let remaining = 0, last = "";
for (const f of readdirSync(DATA).filter((f) => f.endsWith(".json"))) {
  const r = JSON.parse(readFileSync(join(DATA, f), "utf8"));
  if ((r.datePublished || "0000-00-00") > TODAY) { remaining++; if (r.datePublished > last) last = r.datePublished; }
}
if (process.argv.includes("--verbose")) console.error(`queued: ${remaining}, last date: ${last || "—"}`);
process.stdout.write(String(remaining));
