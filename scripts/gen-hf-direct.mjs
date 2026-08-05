#!/usr/bin/env node
// Generate food image using free HuggingFace Inference API (stable-diffusion-xl-base-1.0)
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-hf-image.mjs <slug>'); process.exit(1); }

const ROOT = process.cwd();
const recipeFile = path.join(ROOT, 'recipes', 'data', `${slug}.json`);
const outFile = path.join(ROOT, 'assets', 'recipes', `${slug}.jpg`);

if (!fs.existsSync(recipeFile)) { console.error(`Recipe not found: ${recipeFile}`); process.exit(1); }

const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const rawPrompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}". Natural soft daylight, shallow depth of field, on a ceramic plate on rustic wood surface. No text, no logos, no hands, no people. Square image.`;

// Truncate prompt for SD (max ~200 chars works best)
const prompt = rawPrompt.slice(0, 300);

const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN || '';
const models = [
  'stabilityai/stable-diffusion-xl-base-1.0',
  'runwayml/stable-diffusion-v1-5',
  'black-forest-labs/FLUX.1-schnell',
];

for (const model of models) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(`  [${model.split('/').pop()}] Attempt ${attempt}...`);
      const headers = { 'Content-Type': 'application/json' };
      if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;
      
      const res = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ inputs: prompt }),
          signal: AbortSignal.timeout(180000),
        }
      );
      
      if (res.status === 503) {
        const data = await res.json();
        const wait = data.estimated_time || 30;
        console.log(`  Model loading, waiting ${Math.min(wait, 120)}s...`);
        await new Promise(r => setTimeout(r, Math.min(wait, 120) * 1000));
        continue;
      }
      
      if (!res.ok) {
        const text = await res.text();
        console.error(`  HTTP ${res.status}: ${text.slice(0, 300)}`);
        continue;
      }
      
      const contentType = res.headers.get('content-type') || '';
      const buf = Buffer.from(await res.arrayBuffer());
      
      if (buf.length < 5000) {
        // Probably an error JSON
        const text = buf.toString('utf8');
        console.error(`  Response too small (${buf.length} bytes): ${text.slice(0, 300)}`);
        continue;
      }
      
      // Convert to JPG if needed
      if (contentType.includes('png') || (!contentType.includes('jpeg') && !contentType.includes('jpg'))) {
        // Save as tmp then convert with sips
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

console.error('✗ All HuggingFace models failed');
process.exit(1);