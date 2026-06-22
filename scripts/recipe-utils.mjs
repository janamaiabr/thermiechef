import fs from 'node:fs';
import path from 'node:path';

export const SETTING_RE = /(\d+\s*(?:sec|second|seconds|min|minute|minutes|hr|hour|hours)\s*\/\s*(?:\d{1,3}\s*°?C|Varoma|0\s*°?C|no temperature)\s*\/\s*(?:(?:Reverse\s*\/\s*)|(?:Reverse\s+))?(?:speed\s*(?:\d+(?:\.\d+)?(?:\s*to\s*speed\s*\d+)?|soft)|dough mode|no speed))/i;
export const BANNED_RE = /\b(detox|weight[- ]?loss|lose weight|cure|cures|heal(?:s|ing)?|immune[- ]?boost|anti[- ]?inflammator|cholesterol|diabet|metabolism boost|fat[- ]?burn)\w*/i;

export const CHEF_CANDIDATES = [
  ['Alice Waters', 'summer vegetable pasta'],
  ['Thomas Keller', 'roast chicken'],
  ['Samin Nosrat', 'buttermilk chicken'],
  ['Hetty McKinnon', 'crispy rice salad'],
  ['Nagi Maehashi', 'teriyaki chicken'],
  ['J. Kenji López-Alt', 'crispy potatoes'],
  ['Claudia Fleming', 'gingerbread cake'],
  ['Ravinder Bhogal', 'cauliflower pilaf'],
  ['Meera Sodha', 'aubergine curry'],
  ['Rachel Roddy', 'pasta e ceci'],
  ['Sohla El-Waylly', 'spiced tomato eggs'],
  ['Nigel Slater', 'mushroom pasta'],
  ['Dan Hong', 'prawn toast'],
  ['Nobu Matsuhisa', 'miso cod'],
  ['Fuchsia Dunlop', 'mapo tofu'],
  ['Marcella Hazan', 'tomato sauce'],
  ['Anna Del Conte', 'minestrone'],
  ['Ruth Rogers', 'tomato bread soup'],
  ['Antonio Carluccio', 'mushroom risotto'],
  ['Skye Gyngell', 'roasted vegetable salad'],
  ['Edna Lewis', 'corn pudding'],
  ['Dorie Greenspan', 'yoghurt cake'],
  ['Rose Levy Beranbaum', 'vanilla sponge cake'],
  ['David Lebovitz', 'chocolate sorbet'],
  ['Mimi Thorisson', 'apple tart'],
  ['Anissa Helou', 'lentil soup'],
  ['Elizabeth David', 'ratatouille'],
  ['Tessa Kiros', 'cinnamon buns'],
  ['Sophie Grigson', 'lemon potatoes'],
  ['Karen Martini', 'eggplant parmigiana'],
  ['Kylie Millar', 'passionfruit pavlova'],
  ['Peter Gilmore', 'cauliflower cream'],
  ['Josh Niland', 'fish kofta'],
  ['Christine Manfield', 'spiced pumpkin soup'],
  ['Luke Nguyen', 'lemongrass chicken'],
];

export function slugify(s) {
  return String(s || 'recipe').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function loadRecipes(dataDir = path.join(process.cwd(), 'recipes', 'data')) {
  return fs.readdirSync(dataDir).filter((f) => f.endsWith('.json') && !f.startsWith('._')).map((f) => JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8')));
}

export function classifyRecipe(r) {
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

export function validateRecipe(r, existing = []) {
  const errors = [];
  const required = ['slug','title','description','category','cuisine','prepMin','cookMin','servings','keywords','thermomixModel','datePublished','intro','ingredients','steps','tips','faq','image'];
  for (const k of required) if (r[k] === undefined || r[k] === null || r[k] === '') errors.push(`missing ${k}`);
  if (!r.inspiredBy?.chef || !r.inspiredBy?.dish) errors.push('missing inspiredBy chef/dish');
  if (!Array.isArray(r.ingredients) || r.ingredients.length < 4) errors.push('needs 4+ ingredients');
  if (!Array.isArray(r.steps) || r.steps.length < 3) errors.push('needs 3+ steps');
  (r.steps || []).forEach((step, i) => { if (!SETTING_RE.test(step)) errors.push(`step ${i + 1} missing inline Thermomix settings`); });
  if (!Array.isArray(r.keywords) || r.keywords.length < 4 || !r.keywords.some((k) => /Thermomix/i.test(k))) errors.push('weak keywords');
  if (!Array.isArray(r.faq) || r.faq.length < 2) errors.push('needs 2+ FAQ');
  if ((r.description || '').length < 80 || !/Thermomix/i.test(r.description || '')) errors.push('weak SEO description');
  if (BANNED_RE.test(JSON.stringify(r))) errors.push('contains banned health/medical language');
  for (const m of JSON.stringify(r).matchAll(/speed\s*(\d{1,2}(?:\.\d+)?)/gi)) if (+m[1] > 10) errors.push(`speed >10 (${m[1]})`);
  for (const m of JSON.stringify(r).matchAll(/(\d{2,3})\s*°?\s*C/gi)) if (+m[1] > 120) errors.push(`temperature >120°C (${m[1]})`);
  const chef = String(r.inspiredBy?.chef || '').toLowerCase();
  if (chef && existing.some((x) => String(x.inspiredBy?.chef || '').toLowerCase() === chef)) errors.push(`chef already used: ${r.inspiredBy.chef}`);
  return errors;
}

export function nextChef(existing) {
  const used = new Set(existing.map((r) => String(r.inspiredBy?.chef || '').toLowerCase()).filter(Boolean));
  const pick = CHEF_CANDIDATES.find(([chef]) => !used.has(chef.toLowerCase()));
  if (!pick) throw new Error('No unused chef candidates left; add more CHEF_CANDIDATES.');
  return { chef: pick[0], dish: pick[1] };
}
