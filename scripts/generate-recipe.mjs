// Generates ONE new Thermomix recipe with Claude, saves it to recipes/data/,
// then rebuilds the whole site. Run daily by the cron.
// Run: ANTHROPIC_API_KEY=... node scripts/generate-recipe.mjs
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "recipes", "data");

// images to rotate through as recipe photos (must exist in /assets)
const IMAGES = [
  "dish-pasta.jpg", "dish-bowl.jpg", "dish-salad.jpg", "dish-chicken.jpg", "dish-soup.jpg",
  "food-risotto.jpg", "food-bread.jpg", "food-cake.jpg", "food-brigadeiro.jpg", "dish-dessert.jpg",
  "dish-pancakes.jpg", "dish-smoothie.jpg", "food-soup.jpg", "dish-bread2.jpg", "hero-table.jpg",
];

const existing = readdirSync(DATA).filter((f) => f.endsWith(".json") && !f.startsWith("._")).map((f) => JSON.parse(readFileSync(join(DATA, f), "utf8")));
const existingTitles = existing.map((r) => r.title);
const existingInspos = existing.map((r) => (r.inspiredBy ? `${r.inspiredBy.chef} — ${r.inspiredBy.dish}` : r.title));
const existingSlugs = new Set(existing.map((r) => r.slug));
const today = (process.env.RECIPE_DATE || new Date().toISOString().slice(0, 10));
const image = IMAGES[existing.length % IMAGES.length];

const SYSTEM = `You are Chef Aly, a top Australian Thermomix consultant. Write ONE new Thermomix RE-INTERPRETATION ("releitura") of an iconic dish made famous by a well-known chef or cookbook author (for example: Yotam Ottolenghi, Nigella Lawson, Jamie Oliver, Donna Hay, Bill Granger, Maggie Beer, Rita Lobo, Gordon Ramsay, Massimo Bottura, Adam Liaw, Matt Preston, Julia Child). Credit the chef in the "inspiredBy" field. Write your OWN original Thermomix method, in your own words — NEVER copy the original recipe's wording. This is an independent homage and is NOT endorsed by or affiliated with the chef.

It must be genuinely useful, accurate and food-safe, and clearly designed for the Thermomix TM6 / TM7.

Hard rules:
- Every method step includes exact machine settings inline in the format "time / temperature / speed" (e.g. "Sauté 3 min / 120°C / speed 1"). Use Varoma for steaming, Reverse blade for delicate/chunky mixes, dough mode for kneading, speed 5–10 for chopping/blending, MC off when reducing.
- Realistic limits: max 120°C (or Varoma), max ~90 min, speeds 0–10. If a step truly needs an oven/stovetop (baking, grilling), say so for that step only.
- NO health, medical, weight-loss, "detox", "immune-boosting" or dietary-benefit claims. Describe food as food, never as medicine. No political or religious content.
- Metric weights (g / ml). Warm, encouraging, down-to-earth voice. Aussie/Brazilian home-cooking friendly.
- Write strong SEO: a clear searchable title, a one-sentence description with the dish + "Thermomix", relevant keywords, and 2–3 FAQ questions people actually search.
- Pick a chef/dish DIFFERENT from these already on the site (do not repeat the same chef-and-dish): ${existingInspos.join("; ") || "(none yet)"}.

Output ONLY valid JSON (no markdown, no code fences), exactly this shape:
{"slug":"kebab-case","title":"","inspiredBy":{"chef":"","dish":""},"description":"","category":"Breakfast|Lunch|Dinner|Dessert|Baking|Snack|Drink","cuisine":"","prepMin":0,"cookMin":0,"servings":0,"keywords":["",""],"thermomixModel":"TM6 / TM7","intro":"2-3 warm sentences","ingredients":["",""],"steps":["",""],"tips":["",""],"faq":[{"q":"","a":""}]}`;

// Guardrail: validate AI output before it auto-publishes. Throws on anything unsafe/off-brand.
const BANNED = /\b(detox|weight[- ]?loss|lose weight|cure|cures|heal(s|ing)?|immune[- ]?boost|anti[- ]?inflammator|cholesterol|diabet|metabolism boost|fat[- ]?burn)\w*/i;
function validateRecipe(r) {
  const errs = [];
  for (const k of ["title", "description", "intro"]) if (!r[k] || String(r[k]).length < 8) errs.push(`missing ${k}`);
  if (!r.inspiredBy || !r.inspiredBy.chef) errs.push("missing inspiredBy chef (must be a famous chef releitura)");
  if (!Array.isArray(r.ingredients) || r.ingredients.length < 2) errs.push("too few ingredients");
  if (!Array.isArray(r.steps) || r.steps.length < 2) errs.push("too few steps");
  const blob = JSON.stringify(r);
  if (BANNED.test(blob)) errs.push("contains a health/medical claim");
  // temperatures must be realistic for a Thermomix (<=120°C, Varoma aside)
  for (const m of blob.matchAll(/(\d{2,3})\s*°?\s*C/gi)) if (+m[1] > 120) errs.push(`unrealistic temperature ${m[1]}°C`);
  for (const m of blob.matchAll(/speed\s*(\d{1,2})/gi)) if (+m[1] > 10) errs.push(`invalid speed ${m[1]}`);
  if (!/\bspeed\b/i.test(blob)) errs.push("no Thermomix speed settings found");
  return errs;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let r, lastErrs = [];
  for (let attempt = 1; attempt <= 3; attempt++) {
    const msg = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 3000,
      thinking: { type: "adaptive" },
      system: SYSTEM,
      messages: [{ role: "user", content: `Write today's new Thermomix recipe. Pick a fresh, appealing dish that isn't already on the list. Make it crave-worthy and easy.${lastErrs.length ? `\n\nYour previous attempt was rejected for: ${lastErrs.join("; ")}. Fix these.` : ""}` }],
    });
    const text = (msg.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    const s = text.indexOf("{"), e = text.lastIndexOf("}");
    try { r = JSON.parse(text.slice(s, e + 1)); } catch { lastErrs = ["invalid JSON"]; continue; }
    lastErrs = validateRecipe(r);
    if (!lastErrs.length) break;
    console.log(`Attempt ${attempt} rejected: ${lastErrs.join("; ")}`);
    r = null;
  }
  if (!r) throw new Error(`No valid recipe after 3 attempts: ${lastErrs.join("; ")}`);

  // de-dupe slug
  let slug = (r.slug || r.title || "recipe").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  while (existingSlugs.has(slug)) slug = `${slug}-${today.slice(5)}`;
  r.slug = slug;
  r.image = image;
  r.datePublished = today;

  writeFileSync(join(DATA, `${slug}.json`), JSON.stringify(r, null, 2) + "\n");
  console.log(`Generated recipe: ${r.title} (${slug})`);

  // rebuild the site
  execSync("node scripts/build.mjs", { cwd: ROOT, stdio: "inherit", env: process.env });
}

main().catch((e) => { console.error(e); process.exit(1); });
