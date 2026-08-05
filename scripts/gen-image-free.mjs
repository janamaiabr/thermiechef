#!/usr/bin/env node
// Generate image using the free Pollinations text API (gptimage model, different endpoint)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-image-free.mjs <slug>'); process.exit(1); }

const ROOT = process.cwd();
const recipeFile = path.join(ROOT, 'recipes', 'data', `${slug}.json`);
const outFile = path.join(ROOT, 'assets', 'recipes', `${slug}.jpg`);

if (!fs.existsSync(recipeFile)) { console.error(`Recipe not found: ${recipeFile}`); process.exit(1); }

const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const prompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}". Natural soft daylight, shallow depth of field, on a ceramic plate on rustic wood surface. No text, no logos, no hands, no people. Square image.`;

console.log(`Generating image for: ${recipe.title}`);

// Try multiple free image generation providers
const providers = [
  // Pollinations with turbo model (different pricing tier)
  {
    name: 'Pollinations-turbo',
    url: (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&model=turbo&nologo=true&seed=${parseInt(crypto.createHash('sha256').update('thermiechef:' + slug).digest('hex').slice(0, 8), 16) % 2147483647}`,
  },
  // Pollinations with gptimage model  
  {
    name: 'Pollinations-gptimage',
    url: (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&model=gptimage&nologo=true`,
  },
];

for (const provider of providers) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const url = provider.url(prompt);
      console.log(`  [${provider.name}] Attempt ${attempt}...`);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ThermieChef/1.0' },
        signal: AbortSignal.timeout(120000),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error(`  [${provider.name}] HTTP ${res.status}: ${text.slice(0, 200)}`);
        continue;
      }
      const contentType = res.headers.get('content-type') || '';
      // Check if we actually got an image
      if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
        const text = await res.text();
        console.error(`  [${provider.name}] Not an image (content-type: ${contentType}): ${text.slice(0, 200)}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 10000) {
        console.error(`  [${provider.name}] Image too small: ${buf.length} bytes`);
        continue;
      }
      fs.writeFileSync(outFile, buf);
      console.log(`✓ Saved ${outFile} (${buf.length} bytes) via ${provider.name}`);
      process.exit(0);
    } catch (err) {
      console.error(`  [${provider.name}] Attempt ${attempt} failed: ${err.message}`);
    }
  }
}

// Last resort: try Pollinations with flux model but without seed (different endpoint behavior)
console.log('  Trying Pollinations flux without seed...');
for (let attempt = 1; attempt <= 2; attempt++) {
  try {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 500))}?width=1024&height=1024&nologo=true&nofeed=true`;
    console.log(`  Attempt ${attempt}...`);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`  HTTP ${res.status}: ${text.slice(0, 300)}`);
      continue;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) {
      console.error(`  Image too small: ${buf.length} bytes`);
      continue;
    }
    fs.writeFileSync(outFile, buf);
    console.log(`✓ Saved ${outFile} (${buf.length} bytes) via Pollinations-flux-noseed`);
    process.exit(0);
  } catch (err) {
    console.error(`  Attempt ${attempt} failed: ${err.message}`);
  }
}

console.error('✗ All image generation providers failed');
process.exit(1);