// Vercel Cron endpoint that generates one new ThermieChef recipe, creates a matching image,
// and commits both files to GitHub main via the Contents API.
// Required env: CRON_SECRET, GOOGLE_AI_STUDIO_API_KEY, GITHUB_TOKEN.
// Optional env: GITHUB_REPOSITORY=janamaiabr/thermiechef, GITHUB_BRANCH=main, GEMINI_IMAGE_MODEL.

const fs = require('node:fs');
const path = require('node:path');

const DATA_DIR = path.join(process.cwd(), 'recipes', 'data');
const TODAY = new Date().toISOString().slice(0, 10);
const SETTING_RE = /(\d+\s*(?:sec|second|seconds|min|minute|minutes|hr|hour|hours)\s*\/\s*(?:\d{1,3}\s*°?C|Varoma|0\s*°?C|no temperature)\s*\/\s*(?:(?:Reverse\s*\/\s*)|(?:Reverse\s+))?(?:speed\s*(?:\d+(?:\.\d+)?(?:\s*to\s*speed\s*\d+)?|soft)|dough mode|no speed))/i;
const BANNED_RE = /\b(detox|weight[- ]?loss|lose weight|cure|cures|heal(?:s|ing)?|immune[- ]?boost|anti[- ]?inflammator|cholesterol|diabet|metabolism boost|fat[- ]?burn)\w*/i;
const CHEFS = [
  ['Alice Waters', 'summer vegetable pasta'], ['Thomas Keller', 'roast chicken'], ['Samin Nosrat', 'buttermilk chicken'],
  ['Hetty McKinnon', 'crispy rice salad'], ['Nagi Maehashi', 'teriyaki chicken'], ['J. Kenji López-Alt', 'crispy potatoes'],
  ['Claudia Fleming', 'gingerbread cake'], ['Ravinder Bhogal', 'cauliflower pilaf'], ['Meera Sodha', 'aubergine curry'],
  ['Rachel Roddy', 'pasta e ceci'], ['Sohla El-Waylly', 'spiced tomato eggs'], ['Dan Hong', 'prawn toast'],
  ['Fuchsia Dunlop', 'mapo tofu'], ['Skye Gyngell', 'roasted vegetable salad'], ['Edna Lewis', 'corn pudding'],
  ['Dorie Greenspan', 'yoghurt cake'], ['Rose Levy Beranbaum', 'vanilla sponge cake'], ['David Lebovitz', 'chocolate sorbet'],
  ['Mimi Thorisson', 'apple tart'], ['Anissa Helou', 'lentil soup'], ['Elizabeth David', 'ratatouille'],
  ['Tessa Kiros', 'cinnamon buns'], ['Sophie Grigson', 'lemon potatoes'], ['Karen Martini', 'eggplant parmigiana'],
  ['Kylie Millar', 'passionfruit pavlova'], ['Peter Gilmore', 'cauliflower cream'], ['Josh Niland', 'fish kofta'],
  ['Christine Manfield', 'spiced pumpkin soup'], ['Luke Nguyen', 'lemongrass chicken'],
];

function slugify(s) { return String(s || 'recipe').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function localRecipes() { return fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'))); }
function classify(r) {
  const t = `${r.title || ''} ${r.category || ''} ${r.cuisine || ''} ${(r.ingredients || []).join(' ')}`.toLowerCase();
  const tags = new Set([r.category].filter(Boolean));
  if (/breakfast|porridge|pancake|hotcake|scrambled|lassi/.test(t)) tags.add('Breakfast');
  if (/dessert|cake|mousse|pudding|custard|jam|caramel|posset|compote|brigadeiro|teacake/.test(t)) tags.add('Dessert');
  if (/bread|focaccia|scroll|galette|tart|pastry|bake/.test(t)) tags.add('Baking');
  if (/soup|gazpacho|minestrone|congee|chowder/.test(t)) tags.add('Soup');
  if (/pasta|spaghetti|noodle|orzo|ragu|ragù|orecchiette/.test(t)) tags.add('Pasta');
  if (/curry|laksa|dal|dhal/.test(t)) tags.add('Curry');
  if (/fish|prawn|crab|seafood|cod|salmon|snapper/.test(t)) tags.add('Seafood');
  if (/chicken|beef|lamb|ham|steak|mince|pork|bacon/.test(t)) tags.add('Meat');
  if (!/chicken|beef|lamb|ham|steak|mince|fish|prawn|crab|seafood|bacon|pork|cod|salmon|snapper/.test(t)) tags.add('Vegetarian');
  if (/salad|cucumber|greens|broccoli|hummus|zucchini|fritter|gazpacho|compote|soup|vegetable|veg/.test(t)) tags.add('Light');
  if ((Number(r.prepMin) || 0) + (Number(r.cookMin) || 0) <= 30) tags.add('Under 30 min');
  return [...tags].filter(Boolean);
}
function validate(r, existing) {
  const e = [];
  ['slug','title','description','category','cuisine','prepMin','cookMin','servings','keywords','thermomixModel','datePublished','intro','ingredients','steps','tips','faq','image'].forEach((k) => { if (r[k] === undefined || r[k] === null || r[k] === '') e.push(`missing ${k}`); });
  if (!r.inspiredBy?.chef || !r.inspiredBy?.dish) e.push('missing inspiredBy');
  if (!Array.isArray(r.steps) || r.steps.length < 3) e.push('needs 3+ steps');
  (r.steps || []).forEach((s, i) => { if (!SETTING_RE.test(s)) e.push(`step ${i + 1} missing settings`); });
  if (!Array.isArray(r.faq) || r.faq.length < 2) e.push('needs 2+ FAQ');
  if (!Array.isArray(r.keywords) || r.keywords.length < 4 || !r.keywords.some((k) => /Thermomix/i.test(k))) e.push('weak keywords');
  if ((r.description || '').length < 80 || !/Thermomix/i.test(r.description || '')) e.push('weak SEO description');
  if (BANNED_RE.test(JSON.stringify(r))) e.push('banned health/medical language');
  const chef = String(r.inspiredBy?.chef || '').toLowerCase();
  if (existing.some((x) => String(x.inspiredBy?.chef || '').toLowerCase() === chef)) e.push(`chef already used: ${r.inspiredBy?.chef}`);
  return e;
}

async function geminiRecipe(target, existing, errors = []) {
  const key = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_AI_STUDIO_API_KEY');
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  const systemPrompt = 'You are Chef Aly, an independent Thermomix consultant in Australia. Write one original Thermomix TM6/TM7 recipe as an independent homage to a famous chef/cookbook author. Never imply endorsement. Warm, simple, encouraging voice. No health, medical, detox, weight-loss or diet-benefit claims. Metric weights. Every method step MUST include inline settings: time / temperature / speed. Use max 120°C or Varoma, speeds 0-10, Reverse, dough mode, MC off + basket as appropriate. If oven/pan is required, say so and still include time / oven temperature / no speed. Output only valid JSON.';
  const userPrompt = `Use this unused chef and dish only: ${target.chef} — ${target.dish}. Existing chefs: ${existing.map((r) => r.inspiredBy?.chef).filter(Boolean).join(', ')}. Date: ${TODAY}. JSON shape exactly: {"slug":"kebab-case","title":"","inspiredBy":{"chef":"${target.chef}","dish":"${target.dish}"},"description":"80+ chars with Thermomix","image":"","category":"Breakfast|Lunch|Dinner|Dessert|Baking|Snack|Drink","cuisine":"","prepMin":0,"cookMin":0,"servings":0,"keywords":["",""],"thermomixModel":"TM6 / TM7","datePublished":"${TODAY}","intro":"2-3 warm sentences","ingredients":[""],"steps":[""],"tips":[""],"faq":[{"q":"","a":""}]}. ${errors.length ? `Fix previous errors: ${errors.join('; ')}` : ''}`;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.8 }
    })
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini text ${res.status}: ${text.slice(0, 500)}`);
  const j = JSON.parse(text);
  const body = (j.candidates || []).flatMap((c) => c.content?.parts || []).map((p) => p.text || '').join('').trim();
  return JSON.parse(body.slice(body.indexOf('{'), body.lastIndexOf('}') + 1));
}

async function geminiImage(prompt) {
  const key = process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_AI_STUDIO_API_KEY');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ contents:[{ role:'user', parts:[{ text: prompt }]}], generationConfig:{ responseModalities:['TEXT','IMAGE'] } }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini image ${res.status}: ${text.slice(0,500)}`);
  const j = JSON.parse(text);
  const part = j.candidates?.flatMap((c) => c.content?.parts || []).find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!part) throw new Error('Gemini returned no image');
  return Buffer.from((part.inlineData || part.inline_data).data, 'base64').toString('base64');
}

async function putFile(repo, branch, filePath, contentBase64, message) {
  const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
  const get = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g,'/')}?ref=${branch}`, { headers });
  const existing = get.ok ? await get.json() : null;
  const res = await fetch(`https://api.github.com/repos/${repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g,'/')}`, { method:'PUT', headers: { ...headers, 'content-type': 'application/json' }, body: JSON.stringify({ message, branch, content: contentBase64, sha: existing?.sha }) });
  const text = await res.text();
  if (!res.ok) throw new Error(`GitHub put ${filePath} ${res.status}: ${text.slice(0,500)}`);
  return JSON.parse(text);
}

module.exports = async function handler(req, res) {
  try {
    const auth = req.headers.authorization || '';
    const secret = req.query?.secret || '';
    if (!process.env.CRON_SECRET || (auth !== `Bearer ${process.env.CRON_SECRET}` && secret !== process.env.CRON_SECRET)) return res.status(401).json({ error: 'unauthorized' });
    for (const k of ['GOOGLE_AI_STUDIO_API_KEY','GITHUB_TOKEN']) if (!process.env[k]) throw new Error(`Missing ${k}`);
    const repo = process.env.GITHUB_REPOSITORY || 'janamaiabr/thermiechef';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const existing = localRecipes();
    const used = new Set(existing.map((r) => String(r.inspiredBy?.chef || '').toLowerCase()).filter(Boolean));
    const pick = CHEFS.find(([chef]) => !used.has(chef.toLowerCase()));
    if (!pick) throw new Error('No unused chef candidates left.');
    const target = { chef: pick[0], dish: pick[1] };
    let recipe, errs = [];
    for (let i = 0; i < 3; i++) {
      recipe = await geminiRecipe(target, existing, errs);
      recipe.slug = slugify(`${recipe.title}-${target.chef}`);
      recipe.inspiredBy = target;
      recipe.datePublished = TODAY;
      recipe.thermomixModel = 'TM6 / TM7';
      recipe.image = `recipes/${recipe.slug}.jpg`;
      recipe.filters = classify(recipe);
      errs = validate(recipe, existing);
      if (!errs.length) break;
      recipe = null;
    }
    if (!recipe) throw new Error(`Invalid recipe after retries: ${errs.join('; ')}`);
    const prompt = `Professional editorial food photography of "${recipe.title}", a Thermomix reinterpretation of ${recipe.inspiredBy.dish}. Cuisine: ${recipe.cuisine}. Key ingredients: ${(recipe.ingredients || []).slice(0,8).join(', ')}. Natural soft daylight, realistic appetising finished dish, ceramic plate or bowl, rustic wood or linen surface, warm premium cookbook style. Show only the finished dish. No text, no logos, no hands, no people, no Thermomix machine. Square 1:1 high resolution.`;
    const image64 = await geminiImage(prompt);
    await putFile(repo, branch, `recipes/data/${recipe.slug}.json`, Buffer.from(`${JSON.stringify(recipe, null, 2)}\n`).toString('base64'), `Add daily ThermieChef recipe: ${recipe.title}`);
    await putFile(repo, branch, `assets/recipes/${recipe.slug}.jpg`, image64, `Add image for ${recipe.title}`);
    return res.status(200).json({ ok: true, slug: recipe.slug, title: recipe.title, chef: recipe.inspiredBy.chef, filters: recipe.filters });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};