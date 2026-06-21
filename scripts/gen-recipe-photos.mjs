#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'recipes', 'data');
const ASSET_DIR = path.join(ROOT, 'assets', 'recipes');
const MANIFEST_PATH = path.join(ROOT, 'recipes', 'PHOTO-MANIFEST.json');
const PROVIDER = process.env.IMAGE_PROVIDER || 'auto';
const GEMINI_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image-preview';
const OPENAI_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1-mini';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!GEMINI_API_KEY && !OPENAI_API_KEY && PROVIDER !== 'pollinations') {
  console.error('Missing GEMINI_API_KEY or OPENAI_API_KEY');
  process.exit(1);
}

const args = new Set(process.argv.slice(2));
const force = args.has('--force');
const dryRun = args.has('--dry-run');
const updateOnly = args.has('--update-only');
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Infinity;
const slugArg = process.argv.find((a) => a.startsWith('--slug='));
const onlySlug = slugArg ? slugArg.split('=')[1] : null;

fs.mkdirSync(ASSET_DIR, { recursive: true });

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function recipeFileForSlug(slug) {
  return path.join(DATA_DIR, `${slug}.json`);
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    const parsed = readJson(MANIFEST_PATH);
    return Array.isArray(parsed) ? parsed : parsed.recipes;
  }

  return fs.readdirSync(DATA_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => {
      const recipe = readJson(path.join(DATA_DIR, file));
      return {
        slug: recipe.slug,
        title: recipe.title,
        chef: recipe.inspiredBy?.chef || '',
        dish: recipe.inspiredBy?.dish || recipe.title,
        category: recipe.category || '',
        cuisine: recipe.cuisine || '',
        target: `assets/recipes/${recipe.slug}.jpg`,
      };
    });
}

function promptFor(item) {
  return `Professional editorial food photography of "${item.title}" (${item.dish}, ${item.cuisine} ${item.category}). Natural soft daylight, shallow depth of field, on a beautiful ceramic plate or bowl on a rustic wood or linen surface, freshly served and garnished, appetising and realistic, overhead or 45-degree angle, warm inviting tones. Show ONLY the finished dish as it really looks. No text, no logos, no hands, no people, no Thermomix machine, no packaging. Square high-resolution image. Make the dish visually accurate: ${item.dish}.`;
}

async function generateWithGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('No GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${text.slice(0, 1000)}`);

  const json = JSON.parse(text);
  const parts = json.candidates?.flatMap((c) => c.content?.parts || []) || [];
  const imagePart = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
  if (!imagePart) throw new Error(`No image returned: ${text.slice(0, 1000)}`);
  const inline = imagePart.inlineData || imagePart.inline_data;
  return { mimeType: inline.mimeType || inline.mime_type || 'image/png', data: Buffer.from(inline.data, 'base64') };
}

async function generateWithOpenAI(prompt) {
  if (!OPENAI_API_KEY) throw new Error('No OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      prompt,
      size: '1024x1024',
      quality: process.env.OPENAI_IMAGE_QUALITY || 'medium',
      output_format: 'jpeg',
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${text.slice(0, 1000)}`);
  const json = JSON.parse(text);
  const b64 = json.data?.[0]?.b64_json;
  const url = json.data?.[0]?.url;
  if (b64) return { mimeType: 'image/jpeg', data: Buffer.from(b64, 'base64') };
  if (url) {
    const img = await fetch(url);
    if (!img.ok) throw new Error(`OpenAI image URL ${img.status}`);
    return { mimeType: img.headers.get('content-type') || 'image/jpeg', data: Buffer.from(await img.arrayBuffer()) };
  }
  throw new Error(`No OpenAI image returned: ${text.slice(0, 1000)}`);
}

function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

async function generateWithPollinations(prompt, slug = '') {
  const params = new URLSearchParams({
    width: '1024',
    height: '1024',
    model: process.env.POLLINATIONS_MODEL || 'flux',
    nologo: 'true',
    seed: String(hashSeed(slug || prompt)),
  });
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 ThermieChef image generator' } });
  if (!res.ok) throw new Error(`Pollinations ${res.status}: ${(await res.text()).slice(0, 500)}`);
  return { mimeType: res.headers.get('content-type') || 'image/jpeg', data: Buffer.from(await res.arrayBuffer()) };
}

async function generateImage(prompt, slug = '') {
  if (PROVIDER === 'gemini') return generateWithGemini(prompt);
  if (PROVIDER === 'openai') return generateWithOpenAI(prompt);
  if (PROVIDER === 'pollinations') return generateWithPollinations(prompt, slug);
  try {
    return await generateWithGemini(prompt);
  } catch (err) {
    const msg = String(err.message || err);
    if (!/API key expired|API_KEY_INVALID|No GEMINI_API_KEY/.test(msg)) throw err;
    console.warn('  Gemini unavailable; falling back to OpenAI');
    try {
      return await generateWithOpenAI(prompt);
    } catch (openAiErr) {
      const openAiMsg = String(openAiErr.message || openAiErr);
      if (!/billing_hard_limit_reached|Billing hard limit|No OPENAI_API_KEY/.test(openAiMsg)) throw openAiErr;
      console.warn('  OpenAI unavailable; falling back to Pollinations');
      return generateWithPollinations(prompt, slug);
    }
  }
}

function saveAsJpg(buffer, mimeType, outPath) {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    fs.writeFileSync(outPath, buffer);
    return;
  }

  const tempExt = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'img';
  const tempPath = `${outPath}.${tempExt}.tmp`;
  fs.writeFileSync(tempPath, buffer);

  try {
    execFileSync('sips', ['-s', 'format', 'jpeg', tempPath, '--out', outPath], { stdio: 'ignore' });
    fs.unlinkSync(tempPath);
  } catch {
    // Fallback: keep bytes at requested path. Browsers sniff MIME correctly, but sips should normally work on macOS.
    fs.renameSync(tempPath, outPath);
  }
}

function updateRecipeImage(slug) {
  const file = recipeFileForSlug(slug);
  const recipe = readJson(file);
  recipe.image = `recipes/${slug}.jpg`;
  fs.writeFileSync(file, `${JSON.stringify(recipe, null, 2)}\n`);
}

const manifest = loadManifest().filter(Boolean);
let selected = manifest;
if (onlySlug) selected = selected.filter((i) => i.slug === onlySlug);
selected = selected.slice(0, limit);

console.log(`Manifest items: ${manifest.length}; selected: ${selected.length}; provider: ${PROVIDER}; gemini: ${GEMINI_MODEL}; openai: ${OPENAI_MODEL}`);

let done = 0;
for (const item of selected) {
  const outPath = path.join(ROOT, 'assets', 'recipes', `${item.slug}.jpg`);
  const exists = fs.existsSync(outPath) && fs.statSync(outPath).size > 10_000;
  if (!force && exists) {
    updateRecipeImage(item.slug);
    console.log(`✓ exists ${item.slug}`);
    continue;
  }

  if (dryRun) {
    console.log(`DRY ${item.slug}: ${promptFor(item)}`);
    continue;
  }

  if (updateOnly) {
    updateRecipeImage(item.slug);
    console.log(`✓ updated JSON only ${item.slug}`);
    continue;
  }

  const prompt = promptFor(item);
  console.log(`→ generating ${item.slug}`);
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { mimeType, data } = await generateImage(prompt, item.slug);
      saveAsJpg(data, mimeType, outPath);
      updateRecipeImage(item.slug);
      done++;
      console.log(`✓ saved ${path.relative(ROOT, outPath)} (${mimeType}, ${fs.statSync(outPath).size} bytes)`);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      const waitMs = /429|Too Many Requests|Queue full/i.test(String(err.message || err)) ? attempt * 45_000 : attempt * 10_000;
      console.error(`  attempt ${attempt} failed for ${item.slug}: ${err.message}`);
      if (attempt < 3) await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  if (lastErr) {
    console.error(`✗ failed ${item.slug}`);
    process.exitCode = 1;
    break;
  }
}

console.log(`Done. Generated ${done} new images.`);
