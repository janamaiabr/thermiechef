// Pollinations image generator using POST method (GET returns 500)
import fs from 'fs';
import path from 'path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node _poll_post_img.mjs <slug>'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));

const prompt = `Professional editorial food photography of "${recipe.title}" (${recipe.inspiredBy.dish}, ${recipe.cuisine} ${recipe.category}). Key ingredients that must visually guide the dish: ${(recipe.ingredients || []).slice(0, 8).join(', ')}. Natural soft daylight, shallow depth of field, on a beautiful ceramic plate or bowl on a rustic wood or linen surface, freshly served and garnished, appetising and realistic, overhead or 45-degree angle, warm inviting tones. Show ONLY the finished dish as it really looks. No text, no logos, no hands, no people, no Thermomix machine, no packaging. Square high-resolution image. Make the dish visually accurate to the recipe title, cuisine and ingredients: ${recipe.title}.`;

function hashSeed(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return (h >>> 0) % 2147483647;
}

const seed = hashSeed(`thermiechef:${slug}`);
const outPath = path.join('assets', 'recipes', `${slug}.jpg`);

console.log(`Generating image for: ${slug}`);
console.log(`Using POST method to Pollinations`);

for (let attempt = 1; attempt <= 3; attempt++) {
  try {
    const res = await fetch('https://image.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        width: 1024,
        height: 1024,
        seed: seed + attempt,
        model: 'flux',
        nologo: true,
        enhance: false,
        nofeed: true
      }),
      signal: AbortSignal.timeout(300_000)
    });
    
    console.log(`Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    
    if (!res.ok) {
      const errText = await res.text();
      console.error(`Error: ${errText.slice(0, 300)}`);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 15000));
        continue;
      }
      process.exit(1);
    }
    
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`Downloaded ${buf.length} bytes`);
    
    if (buf.length < 10000) {
      console.error(`Image too small: ${buf.length} bytes`);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 15000));
        continue;
      }
      process.exit(1);
    }
    
    fs.writeFileSync(outPath, buf);
    console.log(`SUCCESS: Saved ${buf.length} bytes to ${outPath}`);
    
    // Verify it's a valid JPEG
    const header = buf.slice(0, 3).toString('hex');
    if (header === 'ffd8ff') {
      console.log('Verified: Valid JPEG file');
    } else {
      console.log(`Header: ${header} (may need conversion)`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(`Attempt ${attempt} failed: ${err.message}`);
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, attempt * 15000));
    } else {
      process.exit(1);
    }
  }
}