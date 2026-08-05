#!/usr/bin/env node
// Generate image directly using Pollinations free API (no key needed, flux model)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-pollinations-direct.mjs <slug>'); process.exit(1); }

const ROOT = process.cwd();
const recipeFile = path.join(ROOT, 'recipes', 'data', `${slug}.json`);
const outFile = path.join(ROOT, 'assets', 'recipes', `${slug}.jpg`);

if (!fs.existsSync(recipeFile)) { console.error(`Recipe not found: ${recipeFile}`); process.exit(1); }

const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const prompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}". Natural soft daylight, shallow depth of field, on a ceramic plate on rustic wood surface. No text, no logos, no hands, no people. Square image.`;

console.log(`Generating image for: ${recipe.title}`);
console.log(`Prompt: ${prompt.slice(0, 120)}...`);

const seedSalt = process.env.IMAGE_SEED_SALT || 'thermiechef';
function hashSeed(str) {
  return parseInt(crypto.createHash('sha256').update(str).digest('hex').slice(0, 8), 16) % 2147483647;
}

const params = new URLSearchParams({
  width: '1024',
  height: '1024',
  model: 'flux',
  nologo: 'true',
  seed: String(hashSeed(`${seedSalt}:${slug}`)),
});

const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
console.log(`Fetching from Pollinations (flux, free tier)...`);

let lastErr;
for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    console.log(`  Attempt ${attempt}...`);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 ThermieChef image generator' },
      signal: AbortSignal.timeout(180000), // 3 min timeout
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Pollinations ${res.status}: ${text.slice(0, 500)}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) throw new Error(`Image too small: ${buf.length} bytes`);
    fs.writeFileSync(outFile, buf);
    console.log(`✓ Saved ${outFile} (${buf.length} bytes)`);
    process.exit(0);
  } catch (err) {
    lastErr = err;
    console.error(`  Attempt ${attempt} failed: ${err.message}`);
    if (attempt < 3) {
      const wait = /429|500|balance/i.test(String(err.message)) ? 30000 : 10000;
      console.log(`  Waiting ${wait/1000}s before retry...`);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}
console.error(`✗ All attempts failed: ${lastErr.message}`);
process.exit(1);