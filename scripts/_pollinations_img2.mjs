import fs from 'fs';
import path from 'path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node _pollinations_img2.mjs <slug>'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));

// Shorter prompt to avoid Pollinations 500 errors
const prompt = `Editorial food photo of ${recipe.title}, ${recipe.cuisine} ${recipe.category}, served in a rustic bowl on linen, garnished with fresh herbs and olive oil drizzle, natural daylight, shallow depth of field, no text no logos no people`;

function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 2147483647;
}

const seed = hashSeed(`thermiechef:${slug}`);
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true&seed=${seed}`;
const outPath = path.join('assets', 'recipes', `${slug}.jpg`);

console.log(`Generating image for: ${slug}`);
console.log(`Prompt: ${prompt}`);

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ThermieChef' },
      signal: AbortSignal.timeout(180_000)
    });
    if (!res.ok) { 
      const text = await res.text();
      console.error(`Attempt ${attempt}: Pollinations ${res.status}: ${text.slice(0, 200)}`);
      if (attempt < 3) { await new Promise(r => setTimeout(r, 15000)); continue; }
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`Downloaded ${buf.length} bytes`);
    if (buf.length < 10000) { 
      console.error(`Attempt ${attempt}: Image too small (${buf.length} bytes)`);
      if (attempt < 3) { await new Promise(r => setTimeout(r, 15000)); continue; }
      process.exit(1);
    }
    fs.writeFileSync(outPath, buf);
    console.log(`Saved to ${outPath} (${buf.length} bytes)`);
    process.exit(0);
  } catch (err) {
    console.error(`Attempt ${attempt}: ${err.message}`);
    if (attempt < 3) { await new Promise(r => setTimeout(r, 15000)); }
    else process.exit(1);
  }
}