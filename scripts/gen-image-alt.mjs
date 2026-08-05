#!/usr/bin/env node
// Generate food image using multiple free image generation approaches
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-image-alt.mjs <slug>'); process.exit(1); }

const ROOT = process.cwd();
const recipeFile = path.join(ROOT, 'recipes', 'data', `${slug}.json`);
const outFile = path.join(ROOT, 'assets', 'recipes', `${slug}.jpg`);

if (!fs.existsSync(recipeFile)) { console.error(`Recipe not found: ${recipeFile}`); process.exit(1); }

const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const rawPrompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}". Natural soft daylight, shallow depth of field, on a ceramic plate on rustic wood surface. No text, no logos, no hands, no people. Square image.`;

// Shorter prompt for better results
const shortPrompt = `Professional food photography of ${recipe.title}, ${recipe.cuisine} cuisine, plated on ceramic dish, natural daylight, overhead angle, realistic, appetizing`;

async function tryPollinations(prompt, model, seed) {
  const params = new URLSearchParams({
    width: '1024',
    height: '1024',
    model: model,
    nologo: 'true',
    nofeed: 'true',
    seed: String(seed),
  });
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?${params}`;
  console.log(`  Trying Pollinations ${model}...`);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) {
      const text = await res.text();
      // Check if it's a JSON error
      try {
        const err = JSON.parse(text);
        if (err.error) console.error(`  Pollinations ${model}: ${err.error.message || err.error}`);
        else console.error(`  Pollinations ${model}: HTTP ${res.status}: ${text.slice(0, 200)}`);
      } catch {
        console.error(`  Pollinations ${model}: HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      return null;
    }
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('json')) {
      const text = await res.text();
      console.error(`  Pollinations ${model}: Got JSON: ${text.slice(0, 200)}`);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) {
      console.error(`  Pollinations ${model}: Image too small: ${buf.length} bytes`);
      return null;
    }
    return { buf, contentType };
  } catch (err) {
    console.error(`  Pollinations ${model}: ${err.message}`);
    return null;
  }
}

async function tryDeepInfra(prompt) {
  // DeepInfra has some free models
  console.log('  Trying DeepInfra flux-schnell...');
  try {
    const res = await fetch('https://api.deepinfra.com/v1/openai/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      }),
      signal: AbortSignal.timeout(120000),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`  DeepInfra: HTTP ${res.status}: ${text.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    if (data.data && data.data[0]) {
      const imageUrl = data.data[0].url || data.data[0].b64_json;
      if (imageUrl && imageUrl.startsWith('http')) {
        const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) });
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length < 10000) { console.error(`  DeepInfra: Image too small: ${buf.length} bytes`); return null; }
        return { buf, contentType: 'image/png' };
      } else if (imageUrl) {
        // b64_json
        const buf = Buffer.from(imageUrl, 'base64');
        if (buf.length < 10000) { console.error(`  DeepInfra: Image too small: ${buf.length} bytes`); return null; }
        return { buf, contentType: 'image/png' };
      }
    }
    console.error('  DeepInfra: No image in response');
    return null;
  } catch (err) {
    console.error(`  DeepInfra: ${err.message}`);
    return null;
  }
}

const seed = parseInt(crypto.createHash('sha256').update('thermiechef:' + slug).digest('hex').slice(0, 8), 16) % 2147483647;

// Try providers in order
const attempts = [
  () => tryPollinations(shortPrompt, 'flux', seed),
  () => tryPollinations(shortPrompt, 'turbo', seed),
  () => tryPollinations(shortPrompt, 'flux-realism', seed),
  () => tryDeepInfra(shortPrompt),
];

for (const attempt of attempts) {
  const result = await attempt();
  if (!result) continue;
  
  // Convert to JPG if needed
  if (result.contentType.includes('png') || !result.contentType.includes('jpeg')) {
    const tmpFile = outFile.replace('.jpg', '.tmp.png');
    fs.writeFileSync(tmpFile, result.buf);
    try {
      const { execFileSync } = await import('node:child_process');
      execFileSync('sips', ['-s', 'format', 'jpeg', tmpFile, '--out', outFile], { stdio: 'ignore' });
      fs.unlinkSync(tmpFile);
    } catch {
      fs.renameSync(tmpFile, outFile);
    }
  } else {
    fs.writeFileSync(outFile, result.buf);
  }
  
  const finalSize = fs.statSync(outFile).size;
  if (finalSize < 10000) {
    console.error(`  Final JPG too small: ${finalSize} bytes`);
    try { fs.unlinkSync(outFile); } catch {}
    continue;
  }
  
  console.log(`✓ Saved ${outFile} (${finalSize} bytes)`);
  process.exit(0);
}

console.error('✗ All image generation providers failed');
process.exit(1);