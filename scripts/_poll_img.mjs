// Simple Pollinations image generator with retries and backoff
import fs from 'fs';
import path from 'path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node _poll_img.mjs <slug>'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));

// Short prompt for Pollinations (their API has issues with long prompts)
const shortPrompt = `A bowl of hearty ${recipe.title}, ${recipe.cuisine} ${recipe.category}, professional food photography, natural daylight, shallow depth of field, rustic bowl, garnished with fresh herbs, no text no logos`;

function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 2147483647;
}

const seed = hashSeed(`thermiechef:${slug}`);
const outPath = path.join('assets', 'recipes', `${slug}.jpg`);

for (let attempt = 1; attempt <= 5; attempt++) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=1024&height=1024&nologo=true&seed=${seed + attempt}&model=flux&enhance=true&nofeed=true`;
  console.log(`Attempt ${attempt}: fetching from Pollinations...`);
  console.log(`URL: ${url.slice(0, 150)}...`);
  
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(300_000) // 5 min timeout
    });
    
    console.log(`Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}, Content-Length: ${res.headers.get('content-length')}`);
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error: ${errText.slice(0, 300)}`);
      if (attempt < 5) {
        const wait = attempt * 30000; // 30s, 60s, 90s, 120s
        console.log(`Waiting ${wait/1000}s before retry...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      process.exit(1);
    }
    
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`Downloaded ${buf.length} bytes`);
    
    if (buf.length < 10000) {
      console.error(`Image too small: ${buf.length} bytes`);
      // Check if it's actually an HTML error page
      const header = buf.slice(0, 100).toString('utf8');
      if (header.includes('<html') || header.includes('<!DOCTYPE')) {
        console.error('Got HTML instead of image');
      }
      if (attempt < 5) {
        const wait = attempt * 30000;
        console.log(`Waiting ${wait/1000}s before retry...`);
        await new Promise(r => setTimeout(r, wait));
        continue;
      }
      process.exit(1);
    }
    
    fs.writeFileSync(outPath, buf);
    console.log(`SUCCESS: Saved ${buf.length} bytes to ${outPath}`);
    process.exit(0);
  } catch (err) {
    console.error(`Attempt ${attempt} failed: ${err.message}`);
    if (attempt < 5) {
      const wait = attempt * 30000;
      console.log(`Waiting ${wait/1000}s before retry...`);
      await new Promise(r => setTimeout(r, wait));
    } else {
      process.exit(1);
    }
  }
}