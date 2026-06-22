#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { classifyRecipe, loadRecipes, nextChef, slugify, validateRecipe } from './recipe-utils.mjs';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = path.join(ROOT, 'recipes', 'data');
const ASSET_DIR = path.join(ROOT, 'assets', 'recipes');
const TODAY = process.env.RECIPE_DATE || new Date().toISOString().slice(0, 10);
fs.mkdirSync(ASSET_DIR, { recursive: true });

async function geminiRecipe(target, existing, errors = []) {
  const key = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_AI_STUDIO_API_KEY');
  const model = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
  const systemPrompt = 'You are Chef Aly, an independent Thermomix consultant in Australia. Write one original Thermomix TM6/TM7 recipe as an independent homage to a famous chef/cookbook author\'s iconic dish. Do not imply endorsement. Warm, simple, encouraging Aly voice. No health, medical, detox, weight-loss or diet-benefit claims. Metric weights. Every method step MUST include inline settings in the format time / temperature / speed, using real Thermomix limits: max 120°C or Varoma, speeds 0-10, Reverse for delicate food, dough mode for dough, MC off + basket on lid for reducing. If oven or pan is required, say it honestly in that step and still include time / oven temperature / no speed. Output only valid JSON.';
  const userPrompt = `Create today's recipe using this unused chef and dish only: ${target.chef} — ${target.dish}. Existing chefs already used: ${existing.map((r) => r.inspiredBy?.chef).filter(Boolean).join(', ')}. JSON shape exactly: {"slug":"kebab-case","title":"","inspiredBy":{"chef":"${target.chef}","dish":"${target.dish}"},"description":"80+ chars with Thermomix","image":"","category":"Breakfast|Lunch|Dinner|Dessert|Baking|Snack|Drink","cuisine":"","prepMin":0,"cookMin":0,"servings":0,"keywords":["",""],"thermomixModel":"TM6 / TM7","datePublished":"${TODAY}","intro":"2-3 warm sentences","ingredients":[""],"steps":[""],"tips":[""],"faq":[{"q":"","a":""}]}. ${errors.length ? `Previous attempt failed: ${errors.join('; ')}. Fix these errors.` : ''}`;
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

async function imageWithGemini(prompt) {
  const key = process.env.GOOGLE_AI_STUDIO_API_KEY || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_AI_STUDIO_API_KEY');
  const model = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview';
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${text.slice(0, 500)}`);
  const json = JSON.parse(text);
  const part = json.candidates?.flatMap((c) => c.content?.parts || []).find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!part) throw new Error(`Gemini returned no image: ${text.slice(0, 500)}`);
  const inline = part.inlineData || part.inline_data;
  return { data: Buffer.from(inline.data, 'base64'), mimeType: inline.mimeType || inline.mime_type || 'image/png' };
}

async function imageWithPollinations(prompt, slug) {
  let h = 2166136261;
  for (const ch of slug) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const params = new URLSearchParams({ width: '1024', height: '1024', model: 'flux', nologo: 'true', seed: String(h >>> 0) });
  const res = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`, { headers: { 'user-agent': 'ThermieChef daily generator' } });
  if (!res.ok) throw new Error(`Pollinations ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return { data: Buffer.from(await res.arrayBuffer()), mimeType: res.headers.get('content-type') || 'image/jpeg' };
}

function writeJpg(buffer, mimeType, outPath) {
  if (/jpe?g/i.test(mimeType)) return fs.writeFileSync(outPath, buffer);
  const tmp = `${outPath}.tmp`;
  fs.writeFileSync(tmp, buffer);
  try { execFileSync('sips', ['-s', 'format', 'jpeg', tmp, '--out', outPath], { stdio: 'ignore' }); fs.unlinkSync(tmp); }
  catch { fs.renameSync(tmp, outPath); }
}

function imagePrompt(r) {
  return `Professional editorial food photography of "${r.title}", a Thermomix reinterpretation of ${r.inspiredBy?.dish || r.title}. Cuisine: ${r.cuisine}. Key ingredients: ${(r.ingredients || []).slice(0, 8).join(', ')}. Natural soft daylight, realistic appetising finished dish, beautiful ceramic plate or bowl, rustic wood or linen surface, warm premium cookbook style, shallow depth of field, 45-degree or overhead angle. Show only the finished dish. No text, no logos, no hands, no people, no Thermomix machine, no packaging. Square 1:1 high resolution.`;
}

async function main() {
  const existing = loadRecipes(DATA_DIR);
  const target = nextChef(existing);
  let lastErrors = [];
  let recipe;
  for (let attempt = 1; attempt <= 3; attempt++) {
    recipe = await geminiRecipe(target, existing, lastErrors);
    recipe.slug = slugify(`${recipe.title}-${target.chef}`);
    recipe.inspiredBy = { chef: target.chef, dish: target.dish };
    recipe.datePublished = TODAY;
    recipe.thermomixModel = 'TM6 / TM7';
    recipe.image = `recipes/${recipe.slug}.jpg`;
    recipe.filters = classifyRecipe(recipe);
    lastErrors = validateRecipe(recipe, existing);
    if (!lastErrors.length) break;
    recipe = null;
  }
  if (!recipe) throw new Error(`Could not generate valid recipe: ${lastErrors.join('; ')}`);
  const prompt = imagePrompt(recipe);
  let image;
  try { image = await imageWithGemini(prompt); }
  catch (e) { console.warn(`Gemini image failed (${e.message}); falling back to Pollinations`); image = await imageWithPollinations(prompt, recipe.slug); }
  writeJpg(image.data, image.mimeType, path.join(ASSET_DIR, `${recipe.slug}.jpg`));
  fs.writeFileSync(path.join(DATA_DIR, `${recipe.slug}.json`), `${JSON.stringify(recipe, null, 2)}\n`);
  execFileSync('node', ['scripts/build.mjs'], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('node', ['scripts/validate-site.mjs'], { cwd: ROOT, stdio: 'inherit' });
  if (process.env.COMMIT_DAILY === '1') {
    execFileSync('git', ['add', '-A'], { cwd: ROOT, stdio: 'inherit' });
    execFileSync('git', ['commit', '-m', `Add daily ThermieChef recipe: ${recipe.title}`], { cwd: ROOT, stdio: 'inherit' });
    execFileSync('git', ['push'], { cwd: ROOT, stdio: 'inherit' });
  }
  console.log(JSON.stringify({ ok: true, slug: recipe.slug, title: recipe.title, chef: recipe.inspiredBy.chef, image: recipe.image }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });