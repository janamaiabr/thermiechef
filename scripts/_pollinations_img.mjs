import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node _pollinations_img.mjs <slug>'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const prompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}" (${recipe.cuisine} ${recipe.category}). Natural soft daylight, shallow depth of field, on a ceramic plate on a rustic wood surface, appetising and realistic. No text, no logos, no hands, no people, no Thermomix machine. Square high-resolution image.`;

function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 2147483647;
}

const seed = hashSeed(`thermiechef:${slug}`);
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;
const outPath = path.join('assets', 'recipes', `${slug}.jpg`);

console.log(`Generating image for: ${slug}`);
console.log(`Prompt length: ${prompt.length}`);
console.log(`URL: ${url.slice(0, 120)}...`);

try {
  const res = await fetch(url, { 
    headers: { 'User-Agent': 'Mozilla/5.0 ThermieChef image generator' },
    signal: AbortSignal.timeout(120_000)
  });
  if (!res.ok) { console.error(`Pollinations ${res.status}`); process.exit(1); }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`Downloaded ${buf.length} bytes`);
  if (buf.length < 10000) { console.error('Image too small, likely failed'); process.exit(1); }
  fs.writeFileSync(outPath, buf);
  console.log(`Saved to ${outPath}`);
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}