// Generate recipe image using MiniMax (has image generation)
const fs = require('fs');
const path = require('path');

const slug = process.argv[2];
if (!slug) { console.error('Usage: node _minimax_img.mjs <slug>'); process.exit(1); }

const MINIMAX_API_KEY = process.env.MINIMAX_API_KEY;
if (!MINIMAX_API_KEY) { console.error('No MINIMAX_API_KEY'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));
const prompt = recipe.photoPrompt || `Professional editorial food photography of "${recipe.title}" (${recipe.cuisine} ${recipe.category}), natural daylight, shallow depth of field, appetising and realistic. No text, no logos, no hands, no people, no Thermomix machine. Square image.`;

const outPath = path.join('assets', 'recipes', `${slug}.jpg`);

async function generateWithMiniMax() {
  console.log(`Generating image for: ${slug}`);
  console.log(`Using MiniMax API`);
  
  // MiniMax image generation API
  const res = await fetch('https://api.minimax.chat/v1/text/image_generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MINIMAX_API_KEY}`
    },
    body: JSON.stringify({
      model: 'image-01',
      prompt: prompt,
      aspect_ratio: '1:1'
    })
  });

  const text = await res.text();
  console.log(`MiniMax status: ${res.status}`);
  
  if (!res.ok) {
    console.error(`MiniMax error: ${text.slice(0, 500)}`);
    process.exit(1);
  }

  const json = JSON.parse(text);
  
  // Check for base64 image data
  const imageData = json.data?.image_urls?.[0] || json.data?.image_url || json.data?.image;
  
  if (imageData) {
    // If it's a URL, download it
    if (imageData.startsWith('http')) {
      console.log(`Downloading from URL: ${imageData.slice(0, 100)}`);
      const imgRes = await fetch(imageData);
      if (!imgRes.ok) { console.error(`Failed to download: ${imgRes.status}`); process.exit(1); }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(outPath, buf);
      console.log(`Saved ${buf.length} bytes to ${outPath}`);
    } else {
      // Base64 data
      const buf = Buffer.from(imageData, 'base64');
      fs.writeFileSync(outPath, buf);
      console.log(`Saved ${buf.length} bytes to ${outPath}`);
    }
  } else {
    console.error('No image data in response');
    console.error('Response keys:', JSON.stringify(Object.keys(json)));
    console.error('Full response:', text.slice(0, 1000));
    process.exit(1);
  }
}

generateWithMiniMax().catch(err => { console.error(err); process.exit(1); });