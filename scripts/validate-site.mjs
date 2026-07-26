import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const DATA = join(ROOT, "recipes", "data");
const ASSETS = join(ROOT, "assets");
const banned = /\b(detox|weight[- ]?loss|lose weight|cure|cures|heal(?:s|ing)?|immune[- ]?boost|anti[- ]?inflammator|cholesterol|diabet|metabolism boost|fat[- ]?burn)\w*/i;
// time / [temp] / [Reverse] speed  — temperature is OPTIONAL (chop/grate/blend steps have no temp)
const setting = /(\d+\s*(?:sec|second|seconds|min|minute|minutes|hr|hour|hours)\s*\/\s*(?:(?:\d{1,3}\s*°?C|Varoma|0\s*°?C|no temperature)\s*\/\s*)?(?:(?:Reverse\s*\/\s*)|(?:Reverse\s+))?(?:speed\s*(?:\d+(?:\.\d+)?(?:\s*to\s*speed\s*\d+)?|soft)|dough mode|no speed))/i;
const errors = [];
const files = readdirSync(DATA).filter(f => f.endsWith(".json"));
const byDate = new Map();
const byInspo = new Map();
const bySlug = new Map();
const byTitle = new Map();
const byImage = new Map();
const byImageHash = new Map();
let future = 0;
const today = process.env.BUILD_DATE || new Date().toISOString().slice(0,10);
for (const f of files) {
  let r;
  try { r = JSON.parse(readFileSync(join(DATA, f), "utf8")); } catch (e) { errors.push(`${f}: invalid JSON`); continue; }
  for (const k of ["slug","title","description","category","cuisine","prepMin","cookMin","servings","keywords","thermomixModel","intro","ingredients","steps","tips","faq","image","datePublished"]) {
    if (r[k] === undefined || r[k] === null || r[k] === "") errors.push(`${f}: missing ${k}`);
  }
  if (!r.inspiredBy?.chef || !r.inspiredBy?.dish) errors.push(`${f}: missing inspiredBy chef/dish`);
  if (r.slug && `${r.slug}.json` !== f) errors.push(`${f}: filename does not match slug`);
  const slugKey = String(r.slug || "").toLowerCase();
  const titleKey = String(r.title || "").trim().toLowerCase();
  if (slugKey) {
    if (bySlug.has(slugKey)) errors.push(`${f}: duplicate slug with ${bySlug.get(slugKey)}`);
    else bySlug.set(slugKey, f);
  }
  if (titleKey) {
    if (byTitle.has(titleKey)) errors.push(`${f}: duplicate title with ${byTitle.get(titleKey)}`);
    else byTitle.set(titleKey, f);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.datePublished || "")) errors.push(`${f}: bad datePublished`);
  if ((r.description || "").length < 80 || !/Thermomix/i.test(r.description || "")) errors.push(`${f}: weak SEO description`);
  if (!Array.isArray(r.keywords) || r.keywords.length < 4 || !r.keywords.some(k => /Thermomix/i.test(k))) errors.push(`${f}: weak keywords`);
  if (!Array.isArray(r.faq) || r.faq.length < 2) errors.push(`${f}: needs 2+ FAQ items`);
  if (!Array.isArray(r.steps) || r.steps.length < 3) errors.push(`${f}: needs 3+ steps`);
  // cooking steps need inline settings, but finishing/serving steps legitimately don't
  const finishing = /\b(serve|serving|to taste|season|rest|resting|garnish|set aside|transfer|pour|spoon|ladle|divide|chill|cool|leave to|stand|enjoy|top with|scatter|sprinkle|drizzle|dust|preheat|bake|baking|roast|grill|oven|plate|cover and|store|fold through|stir through|pan|skillet|each side|fry|frying|griddle|barbecue|bbq|toast)\b/i;
  (r.steps || []).forEach((step, i) => { if (!setting.test(step) && !finishing.test(step)) errors.push(`${f}: step ${i+1} missing inline Thermomix settings`); });
  const blob = JSON.stringify(r);
  if (banned.test(blob)) errors.push(`${f}: contains banned health/medical language`);
  (r.steps || []).forEach((step, i) => { for (const m of String(step).matchAll(/(\d{2,3})\s*°?\s*C/gi)) { if (+m[1] > 120 && !/oven|bake|roast|preheated/i.test(step)) errors.push(`${f}: non-oven temp >120°C in step ${i+1} (${m[1]})`); } });
  for (const m of blob.matchAll(/speed\s*(\d{1,2}(?:\.\d+)?)/gi)) if (+m[1] > 10) errors.push(`${f}: speed >10 (${m[1]})`);
  const expectedImage = `recipes/${r.slug}.jpg`;
  const imagePath = join(ASSETS, r.image || "");
  if (r.image !== expectedImage) {
    errors.push(`${f}: recipe must use a unique generated photo (${expectedImage}), not ${r.image}`);
  }
  if (!existsSync(imagePath)) {
    errors.push(`${f}: image not found (${r.image})`);
  } else {
    const size = statSync(imagePath).size;
    if (size < 10_000) errors.push(`${f}: image too small (${r.image}, ${size} bytes)`);
    const imageKey = String(r.image || "").toLowerCase();
    if (byImage.has(imageKey)) errors.push(`${f}: duplicate image path with ${byImage.get(imageKey)}`);
    else byImage.set(imageKey, f);
    const digest = createHash("sha256").update(readFileSync(imagePath)).digest("hex");
    if (byImageHash.has(digest)) errors.push(`${f}: duplicate image file content with ${byImageHash.get(digest)}`);
    else byImageHash.set(digest, f);
  }
  const generatedPhoto = r.imageApproved === true && (r.photoStatus === "auto_generated" || r.photoStatus === "approved");
  if (!generatedPhoto) {
    errors.push(`${f}: recipe photo must be auto_generated and imageApproved true`);
  }
  if (!r.photoPrompt || !String(r.photoPrompt).includes(r.title)) {
    errors.push(`${f}: missing recipe-specific photoPrompt`);
  }
  const promptText = String(r.photoPrompt || "").toLowerCase();
  const ingredientHits = (r.ingredients || [])
    .map((i) => String(i).toLowerCase().replace(/^\d+(?:\.\d+)?\s*(?:g|ml|tbsp|tsp|cup|cups)?\s*/i, "").split(/[,()]/)[0].trim())
    .filter((i) => i.length >= 4)
    .filter((i) => promptText.includes(i.split(/\s+/).slice(-1)[0] || i));
  if (ingredientHits.length < 2) {
    errors.push(`${f}: photoPrompt must include at least 2 recipe ingredients`);
  }
  if (r.pendingImage) {
    errors.push(`${f}: pendingImage is not allowed; daily photos must be final generated assets`);
  }
  const inspo = `${(r.inspiredBy?.chef||"").toLowerCase()}|${(r.inspiredBy?.dish||"").toLowerCase()}`;
  if (byInspo.has(inspo)) errors.push(`${f}: duplicate inspiredBy with ${byInspo.get(inspo)}`); else byInspo.set(inspo, f);
  if ((r.datePublished || "") > today) future++;
  if (byDate.has(r.datePublished)) byDate.set(r.datePublished, byDate.get(r.datePublished)+1); else byDate.set(r.datePublished, 1);
}
if (future < 7) console.warn(`⚠️ queue short: ${future} future recipes; daily generator should replenish automatically`);
const home = readFileSync(join(ROOT, "index.html"), "utf8");
for (const needle of ['<title>', 'meta name="description"', 'rel="canonical"', 'twitter:card', 'RECIPES:START']) {
  if (!home.includes(needle)) errors.push(`homepage missing ${needle}`);
}
const llms = readFileSync(join(ROOT, "llms.txt"), "utf8");
if (!llms.includes("## Recipes") || !llms.includes("Thermomix")) errors.push("llms.txt is weak/missing recipe context");
const robots = readFileSync(join(ROOT, "robots.txt"), "utf8");
if (!robots.includes("GPTBot") || !robots.includes("Sitemap:")) errors.push("robots.txt missing AI crawler/sitemap directives");
if (errors.length) {
  console.error(errors.map(e => `❌ ${e}`).join("\n"));
  process.exit(1);
}
console.log(`✅ Validated ${files.length} recipe JSON files; ${future} future queued; SEO/LLM basics present.`);
