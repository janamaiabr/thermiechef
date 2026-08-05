// Try MiniMax image generation v2 API
const fs = require('fs');
const path = require('path');

const slug = process.argv[2];
if (!slug) { console.error('Usage: node _minimax_img2.cjs <slug>'); process.exit(1); }

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
if (!MINIMAX_API_KEY) { console.error('No MINIMAX_API_KEY'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const prompt = `Professional editorial food photography of "${recipe.title}" (${recipe.cuisine} ${recipe.category}), natural daylight, shallow depth of field, appetising and realistic. No text, no logos, no hands, no people, no Thermomix machine. Square image.`;

const outPath = path.join('assets', 'recipes', `${slug}.jpg`);

async function tryEndpoint(url, body) {
  console.log(`Trying: ${url}`);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text.slice(0, 500)}`);
  return { status: res.status, text };
}

async function main() {
  console.log(`Generating image for: ${slug}`);
  
  // Try the v1 generation endpoint
  const result = await tryEndpoint('https://api.minimax.chat/v1/image/generation', {
    model: 'image-01',
    prompt: prompt,
    n: 1,
    size: '1024x1024'
  });
  
  if (result.status === 200) {
    try {
      const json = JSON.parse(result.text);
      // Try to extract image data
      const url = json.data?.[0]?.url || json.data?.url || json.data?.image_urls?.[0];
      if (url && url.startsWith('http')) {
        console.log(`Downloading from URL...`);
        const imgRes = await fetch(url);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        fs.writeFileSync(outPath, buf);
        console.log(`Saved ${buf.length} bytes to ${outPath}`);
        process.exit(0);
      }
    } catch(e) {}
  }
  
  // If that failed, try the group_id approach (async generation)
  console.log('Sync generation failed, trying async...');
  const result2 = await tryEndpoint('https://api.minimax.chat/v1/image/generation', {
    model: 'image-01',
    prompt: prompt
  });
  
  console.log('All endpoints exhausted');
  process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });