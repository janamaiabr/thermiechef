#!/usr/bin/env node
// Generate food image using Cloudflare Workers AI
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-cf-image.mjs <slug>'); process.exit(1); }

const ROOT = process.cwd();
const recipeFile = path.join(ROOT, 'recipes', 'data', `${slug}.json`);
const outFile = path.join(ROOT, 'assets', 'recipes', `${slug}.jpg`);

if (!fs.existsSync(recipeFile)) { console.error(`Recipe not found: ${recipeFile}`); process.exit(1); }

const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const rawPrompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}". Natural soft daylight, shallow depth of field, on a ceramic plate on rustic wood surface. No text, no logos, no hands, no people. Square image.`;

// SD/XL prompts work better with shorter, more focused prompts
const prompt = `Professional food photography, ${recipe.title}, ${recipe.cuisine} cuisine, plated dish, natural daylight, shallow depth of field, ceramic plate, rustic wood surface, appetizing, realistic, no text, no logos, no hands, no people`;

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = '156b5353f6b600199a695d82f0a4a616';

const models = [
  '@cf/black-forest-labs/flux-1-schnell',
  '@cf/stabilityai/stable-diffusion-xl-base-1.0',
];

for (const model of models) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`  [${model.split('/').pop()}] Attempt ${attempt}...`);
      
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${model}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${CF_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt }),
          signal: AbortSignal.timeout(180000),
        }
      );
      
      if (!res.ok) {
        const text = await res.text();
        console.error(`  HTTP ${res.status}: ${text.slice(0, 300)}`);
        continue;
      }
      
      const contentType = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      
      if (buf.length < 5000) {
        console.error(`  Response too small (${buf.length} bytes)`);
        continue;
      }
      
      // CF returns image/png typically
      if (contentType.includes('png') || !contentType.includes('jpeg')) {
        const tmpFile = outFile.replace('.jpg', '.tmp.png');
        fs.writeFileSync(tmpFile, buf);
        try {
          const { execFileSync } = await import('node:child_process');
          execFileSync('sips', ['-s', 'format', 'jpeg', tmpFile, '--out', outFile], { stdio: 'ignore' });
          fs.unlinkSync(tmpFile);
        } catch {
          fs.renameSync(tmpFile, outFile);
        }
      } else {
        fs.writeFileSync(outFile, buf);
      }
      
      const finalSize = fs.statSync(outFile).size;
      if (finalSize < 10000) {
        console.error(`  Final JPG too small: ${finalSize} bytes`);
        fs.unlinkSync(outFile);
        continue;
      }
      
      console.log(`✓ Saved ${outFile} (${finalSize} bytes) via ${model.split('/').pop()}`);
      process.exit(0);
    } catch (err) {
      console.error(`  Failed: ${err.message}`);
    }
  }
}

console.error('✗ All Cloudflare AI models failed');
process.exit(1);