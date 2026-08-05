// Generate image via HuggingFace Inference API (free tier)
import fs from 'fs';
import path from 'path';

const slug = process.argv[2];
const HF_TOKEN = process.argv[3] || '';
if (!slug) { console.error('Usage: node _hf_img.mjs <slug> [HF_TOKEN]'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));

const prompt = `Professional editorial food photography of "${recipe.title}", ${recipe.cuisine} ${recipe.category}, served in a rustic ceramic bowl on linen, garnished with fresh herbs, natural daylight, shallow depth of field, appetising. No text, no logos, no people.`;

const outPath = path.join('assets', 'recipes', `${slug}.jpg`);

async function main() {
  console.log(`Generating image for: ${slug}`);
  console.log('Using HuggingFace Inference API (free tier)...');
  
  const models = [
    'black-forest-labs/FLUX.1-schnell',
    'stabilityai/stable-diffusion-xl-base-1.0',
    'runwayml/stable-diffusion-v1-5'
  ];
  
  for (const model of models) {
    console.log(`Trying model: ${model}`);
    
    const headers = { 'Content-Type': 'application/json' };
    if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;
    
    try {
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            width: 1024,
            height: 1024,
            seed: Math.floor(Math.random() * 2147483647)
          }
        }),
        signal: AbortSignal.timeout(300_000)
      });
      
      console.log(`Status: ${res.status}`);
      
      if (res.status === 503) {
        const data = await res.json();
        console.log(`Model loading: ${data.estimated_time || '?'}s`);
        if (data.estimated_time && data.estimated_time > 60) {
          console.log('Taking too long, trying next model...');
          continue;
        }
        // Wait and retry
        await new Promise(r => setTimeout(r, (data.estimated_time || 30) * 1000));
        const retryRes = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ inputs: prompt, parameters: { width: 1024, height: 1024 } }),
          signal: AbortSignal.timeout(300_000)
        });
        if (!retryRes.ok) {
          console.log(`Retry failed: ${retryRes.status}`);
          continue;
        }
        const buf = Buffer.from(await retryRes.arrayBuffer());
        if (buf.length < 10000) { console.log('Image too small'); continue; }
        fs.writeFileSync(outPath, buf);
        console.log(`SUCCESS: Saved ${buf.length} bytes to ${outPath}`);
        process.exit(0);
      }
      
      if (!res.ok) {
        const err = await res.text();
        console.log(`Error: ${err.slice(0, 300)}`);
        continue;
      }
      
      const buf = Buffer.from(await res.arrayBuffer());
      console.log(`Downloaded ${buf.length} bytes`);
      
      if (buf.length < 10000) { console.log('Image too small'); continue; }
      
      fs.writeFileSync(outPath, buf);
      console.log(`SUCCESS: Saved ${buf.length} bytes to ${outPath}`);
      process.exit(0);
    } catch (err) {
      console.log(`Error with ${model}: ${err.message}`);
      continue;
    }
  }
  
  console.error('All models failed');
  process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });