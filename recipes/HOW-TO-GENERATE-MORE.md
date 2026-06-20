# How to generate more ThermieChef recipes (canonical playbook)

This is the single source of truth for adding recipes. Follow it exactly and new
recipes will match the existing ones perfectly. When the owner says "gera mais
receitas pro ThermieChef", do THIS.

## The concept
Every recipe is a **"releitura" (reimagining) of an iconic dish by a famous chef
or cookbook author**, rebuilt for the **Thermomix (TM6 / TM7)**. It is an
independent homage — NOT endorsed by or affiliated with the chef. Chef Aly / brand = **ThermieChef**.

## Exact JSON shape (one file per recipe at `recipes/data/<slug>.json`)
```json
{
  "slug": "kebab-case-with-chef",            // e.g. "silky-hummus-ottolenghi"
  "title": "Short Searchable Title",          // e.g. "Silky Hummus"
  "inspiredBy": { "chef": "Full Chef Name", "dish": "the dish" },
  "description": "One sentence with the dish + 'Thermomix' (SEO).",
  "image": "food-soup.jpg",                   // a file that EXISTS in /assets (see list)
  "category": "Breakfast|Lunch|Dinner|Dessert|Baking|Snack|Drink",
  "cuisine": "Italian / Indian / Australian / ...",
  "prepMin": 10,
  "cookMin": 20,
  "servings": 4,
  "keywords": ["thermomix X", "chef dish thermomix", "TM6 ..."],
  "thermomixModel": "TM6 / TM7",
  "datePublished": "YYYY-MM-DD",              // for the QUEUE use a FUTURE date (see below)
  "intro": "2-3 warm sentences in Aly's voice, naming the chef.",
  "ingredients": ["250 g chickpeas", "2 garlic cloves", "..."],
  "steps": ["Step with exact settings: 'Sauté 3 min / 120°C / speed 1.'", "..."],
  "tips": ["short tip", "short tip"],
  "faq": [ { "q": "real search question", "a": "answer" } ]
}
```

## Hard rules (match these exactly)
- **Every method step has settings inline**: `time / temperature / speed` (e.g. `Sauté 3 min / 120°C / speed 1`). Use **Varoma** (steaming), **Reverse** blade (delicate/chunky), **dough mode** (kneading), **speed 5–10** (chop/blend), **MC off + basket on the lid** (reducing/splatter).
- Realistic limits: **max 120°C** (or Varoma), max ~90 min, speeds 0–10. If a step truly needs an oven/stovetop (baking, grilling), say so for that step only and add it to "intro/steps" honestly.
- **NO health / medical / weight-loss / detox / dietary-benefit claims.** No political/religious content.
- Metric weights (g / ml). Warm, encouraging, down-to-earth voice.
- Strong SEO: searchable title, one-line description with the dish + "Thermomix", real keywords, 1–3 FAQ.
- **Never repeat a chef** already used (read `recipes/data/*.json` and check `inspiredBy.chef`).

## Best reference = the existing files
- Look at any existing `recipes/data/*.json` (e.g. `silky-hummus-ottolenghi.json`) for the exact tone/length.
- `scripts/seed-batch.mjs` and `scripts/seed-queue.mjs` are the format used to write batches.

## Dates: the keyless auto-publish QUEUE
- `scripts/build.mjs` only publishes recipes whose `datePublished` is **today or earlier**. Future-dated recipes sit invisible in the queue and the daily GitHub Action releases one per day.
- So for new batches, give each recipe a **future date, one per day**, starting the day after the last queued recipe. (Find the latest queued date: `node scripts/queue-status.mjs --verbose`.)

## Images available in /assets (reuse these; owner can swap for her own later)
dish-pasta, dish-bowl, dish-salad, dish-chicken, dish-soup, dish-dessert, dish-pancakes, dish-smoothie, dish-bread2, food-risotto, food-bread, food-cake, food-brigadeiro, food-soup, hero-table (all `.jpg`).

## Steps to add a batch
1. Write a `scripts/seed-<name>.mjs` (copy `seed-queue.mjs`) with the new recipes and future dates.
2. `node scripts/seed-<name>.mjs` then `node scripts/build.mjs` (verify only arrived recipes publish).
3. `git add -A && git commit -m "..." && git push` — Vercel is git-connected and auto-deploys.

## Chefs already used (do NOT repeat)
Yotam Ottolenghi, Nigella Lawson, Jamie Oliver, Donna Hay, Bill Granger, Rita Lobo,
Gordon Ramsay, Julia Child, José Andrés, Mary Berry, Ina Garten, Alison Roman,
Madhur Jaffrey, Adam Liaw, Maggie Beer, Claudia Roden, Rick Stein, Poh Ling Yeow,
Paul Hollywood, Delia Smith, Nigel Slater, Sabrina Ghayour, Anna Jones, Curtis Stone,
Kylie Kwong, Stephanie Alexander, Tom Kerridge, Massimo Bottura, Diana Henry,
David Chang, Marco Pierre White, Neil Perry.
(Always re-check `recipes/data/*.json` — this list may be out of date.)
