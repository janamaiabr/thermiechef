// Builds all recipe pages, the recipes index, sitemap.xml, llms.txt,
// and refreshes the latest-recipes block on the homepage.
// Run: node scripts/build.mjs   (no API key needed)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderRecipePage, renderIndexPage, homepageCards, totalMin } from "./lib/template.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = (process.env.SITE_URL || "https://www.alydigital.online").replace(/\/$/, "");
const DATA = join(ROOT, "recipes", "data");

function loadRecipes() {
  const files = readdirSync(DATA).filter((f) => f.endsWith(".json"));
  const list = files.map((f) => JSON.parse(readFileSync(join(DATA, f), "utf8")));
  // newest first by datePublished, then title
  list.sort((a, b) => (b.datePublished || "").localeCompare(a.datePublished || "") || a.title.localeCompare(b.title));
  return list;
}

function build() {
  // date-gated publishing: only recipes whose datePublished has arrived go live.
  // Future-dated recipes sit in the queue (recipes/data/) until their day comes.
  const TODAY = process.env.BUILD_DATE || new Date().toISOString().slice(0, 10);
  const queueAll = loadRecipes();
  const recipes = queueAll.filter((r) => (r.datePublished || "0000-00-00") <= TODAY);
  const queued = queueAll.length - recipes.length;
  mkdirSync(join(ROOT, "recipes"), { recursive: true });

  // 1. individual recipe pages
  for (const r of recipes) {
    writeFileSync(join(ROOT, "recipes", `${r.slug}.html`), renderRecipePage(r, SITE_URL));
  }
  // remove orphan pages whose recipe data was deleted
  const valid = new Set(recipes.map((r) => `${r.slug}.html`));
  for (const f of readdirSync(join(ROOT, "recipes"))) {
    if (f.endsWith(".html") && f !== "index.html" && !valid.has(f)) {
      try { unlinkSync(join(ROOT, "recipes", f)); } catch (_) {}
    }
  }

  // 2. recipes index
  writeFileSync(join(ROOT, "recipes", "index.html"), renderIndexPage(recipes, SITE_URL));

  // 3. sitemap.xml
  const today = recipes[0]?.datePublished || "2026-06-20";
  const urls = [
    { loc: `${SITE_URL}/`, lastmod: today, pri: "1.0" },
    { loc: `${SITE_URL}/recipes/`, lastmod: today, pri: "0.9" },
    ...recipes.map((r) => ({ loc: `${SITE_URL}/recipes/${r.slug}.html`, lastmod: r.datePublished, pri: "0.8" })),
    { loc: `${SITE_URL}/privacy.html`, lastmod: today, pri: "0.2" },
    { loc: `${SITE_URL}/terms.html`, lastmod: today, pri: "0.2" },
  ];
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><changefreq>daily</changefreq><priority>${u.pri}</priority></url>`)
    .join("\n")}\n</urlset>\n`;
  writeFileSync(join(ROOT, "sitemap.xml"), sitemap);

  // 4. robots.txt
  writeFileSync(
    join(ROOT, "robots.txt"),
    `User-agent: *\nAllow: /\n\n# AI / LLM crawlers welcome\nUser-agent: GPTBot\nAllow: /\nUser-agent: OAI-SearchBot\nAllow: /\nUser-agent: ClaudeBot\nAllow: /\nUser-agent: Claude-Web\nAllow: /\nUser-agent: PerplexityBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
  );

  // 5. llms.txt — structured pointer for LLMs
  const llms = `# Chef Aly — Thermomix Recipes\n\n> Chef Aly is a top Australian Thermomix consultant. This site has reliable, tested Thermomix recipes (TM6 / TM7) with exact speeds, times and temperatures, plus a free tool that converts any recipe into a Thermomix recipe.\n\n## Recipes\n${recipes
    .map((r) => `- [${r.title}](${SITE_URL}/recipes/${r.slug}.html): ${r.description} (${totalMin(r)} min, serves ${r.servings})`)
    .join("\n")}\n\n## Tools\n- [Recipe converter](${SITE_URL}/index.html#convert): Paste any recipe and get back the Thermomix method.\n\n## Contact\n- WhatsApp: +61 424 310 504\n- Buy a Thermomix through Chef Aly: ${SITE_URL}/index.html#offer\n`;
  writeFileSync(join(ROOT, "llms.txt"), llms);

  // 6. refresh homepage latest-recipes block (newest 6)
  const idxPath = join(ROOT, "index.html");
  let html = readFileSync(idxPath, "utf8");
  const cards = homepageCards(recipes.slice(0, 6));
  html = html.replace(/<!-- RECIPES:START -->[\s\S]*?<!-- RECIPES:END -->/, `<!-- RECIPES:START -->\n${cards}\n      <!-- RECIPES:END -->`);
  writeFileSync(idxPath, html);

  console.log(`Built ${recipes.length} recipes → pages, index, sitemap, robots, llms.txt, homepage. SITE_URL=${SITE_URL}`);
}

build();
