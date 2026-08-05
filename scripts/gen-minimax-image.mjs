#!/usr/bin/env node
// Generate food image using Minimax API (image-01 model)
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-minimax-image.mjs <slug>'); process.exit(1); }

const ROOT = process.cwd();
const recipeFile = path.join(ROOT, 'recipes', 'data', `${slug}.json`);
const outFile = path.join(ROOT, 'assets', 'recipes', `${slug}.jpg`);

if (!fs.existsSync(recipeFile)) { console.error(`Recipe not found: ${recipeFile}`); process.exit(1); }

const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const rawPrompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}". Natural soft daylight, shallow depth of field, on a ceramic plate on rustic wood surface. No text, no logos, no hands, no people. Square image.`;

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
if (!MINIMAX_API_KEY) { console.error('MINIMAX_API_KEY not set'); process.exit(1); }

// Minimax image generation API
// Try /v1/image_generation endpoint
console.log(`Generating image for: ${recipe.title}`);

// First, let's try the Minimax Chat Completion API with image generation
// Minimax uses different endpoints - let me check what's available
const prompt = rawPrompt;

// Method 1: Try /v1/image_generation
try {
  console.log('  Trying Minimax image generation API...');
  const res = await fetch(`https://api.minimax.chat/v1/image_generation?GroupId=default`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'image-01',
      prompt: prompt.slice(0, 500),
      n: 1,
      size: '1024x1024',
    }),
    signal: AbortSignal.timeout(120000),
  });

  console.log(`  Status: ${res.status}`);
  const text = await res.text();
  
  if (res.ok) {
    const data = JSON.parse(text);
    if (data.data && data.data.image_urls) {
      const imageUrl = data.data.image_urls[0];
      console.log(`  Got image URL: ${imageUrl.slice(0, 80)}...`);
      const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(60000) });
      const buf = Buffer.from(await imgRes.arrayBuffer());
      if (buf.length < 10000) {
        console.error(`  Image too small: ${buf.length} bytes`);
      } else {
        // Save and convert if needed
        if (imageUrl.includes('.png')) {
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
        console.log(`✓ Saved ${outFile} (${finalSize} bytes) via Minimax`);
        process.exit(0);
      }
    } else if (data.data && data.data[0]) {
      // Base64 format
      const b64 = data.data[0].b64_json || data.data[0].url;
      if (b64 && !b64.startsWith('http')) {
        const buf = Buffer.from(b64, 'base64');
        if (buf.length < 10000) {
          console.error(`  Image too small: ${buf.length} bytes`);
        } else {
          fs.writeFileSync(outFile, buf);
          console.log(`✓ Saved ${outFile} (${buf.length} bytes) via Minimax (base64)`);
          process.exit(0);
        }
      }
    }
    console.error('  Response structure:', JSON.stringify(data).slice(0, 500));
  } else {
    console.error(`  Error: ${text.slice(0, 500)}`);
  }
} catch (err) {
  console.error(`  Minimax image_generation failed: ${err.message}`);
}

// Method 2: Try the chat completion API with image output
try {
  console.log('  Trying Minimax chat API with image...');
  const res = await fetch(`https://api.minimax.chat/v1/text/chatcompletion_v2`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'MiniMax-Text-01',
      messages: [
        { role: 'user', content: prompt.slice(0, 300) }
      ],
    }),
    signal: AbortSignal.timeout(30000),
  });
  console.log(`  Chat status: ${res.status}`);
  const text = await res.text();
  console.error(`  Chat response: ${text.slice(0, 300)}`);
} catch (err) {
  console.error(`  Minimax chat failed: ${err.message}`);
}

console.error('✗ Minimax image generation failed');
process.exit(1);