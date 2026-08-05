// Generate image via Stable Horde (free, community-powered)
import fs from 'fs';
import path from 'path';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node _horde_img.mjs <slug>'); process.exit(1); }

const recipeFile = path.join('recipes', 'data', `${slug}.json`);
const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));

const prompt = `Professional editorial food photography of "${recipe.title}" (${recipe.inspiredBy.dish}, ${recipe.cuisine} ${recipe.category}). Key ingredients: ${(recipe.ingredients || []).slice(0, 6).join(', ')}. Natural soft daylight, shallow depth of field, on a ceramic bowl on rustic linen, garnished, appetising. No text, no logos, no hands, no people. Square image.`;
const negPrompt = 'text, watermark, logo, people, hands, cartoon, illustration, blurry, dark, unappetizing, thermomix machine, packaging';

async function main() {
  console.log(`Generating image for: ${slug}`);
  console.log('Using Stable Horde API...');
  
  // Step 1: Submit generation request
  const requestBody = {
    prompt: prompt,
    nsfw: false,
    params: {
      cfg_scale: 7,
      steps: 30,
      width: 1024,
      height: 1024,
      sampler_name: "k_euler",
      seed: String(Math.floor(Math.random() * 2147483647)),
      negative_prompt: negPrompt,
      model_name: "AlbedoBase XL (SDXL)"
    },
    models: ["AlbedoBase XL (SDXL)"],
    r2: true
  };

  const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Agent': 'ThermieChef:1.0:thermiechef' },
    body: JSON.stringify(requestBody)
  });

  if (!submitRes.ok) {
    const err = await submitRes.text();
    console.error(`Submit failed ${submitRes.status}: ${err.slice(0, 300)}`);
    process.exit(1);
  }

  const submitData = await submitRes.json();
  const id = submitData.id;
  console.log(`Generation ID: ${id}`);

  // Step 2: Poll for result
  for (let i = 0; i < 120; i++) {  // 10 min max
    await new Promise(r => setTimeout(r, 5000)); // 5 second intervals
    const checkRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`, {
      headers: { 'Client-Agent': 'ThermieChef:1.0:thermiechef' }
    });
    const checkData = await checkRes.json();
    console.log(`  Status: ${checkData.status || checkData.state} (wait: ${checkData.wait_time}s, queue: ${checkData.queue_position || '?'})`);
    
    if (checkData.done || checkData.status === 'done' || checkData.state === 'done') {
      // Get the result
      const resultRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, {
        headers: { 'Client-Agent': 'ThermieChef:1.0:thermiechef' }
      });
      const resultData = await resultRes.json();
      
      const generation = resultData.generations?.[0];
      if (!generation) {
        console.error('No generation in result:', JSON.stringify(resultData).slice(0, 500));
        process.exit(1);
      }

      const imgUrl = generation.img || generation.url;
      if (!imgUrl) {
        console.error('No image URL:', JSON.stringify(generation).slice(0, 500));
        process.exit(1);
      }

      console.log(`Downloading from: ${imgUrl.slice(0, 80)}...`);
      const imgRes = await fetch(imgUrl);
      if (!imgRes.ok) {
        console.error(`Download failed: ${imgRes.status}`);
        process.exit(1);
      }
      const buf = Buffer.from(await imgRes.arrayBuffer());
      console.log(`Downloaded ${buf.length} bytes`);
      
      if (buf.length < 10000) {
        console.error('Image too small');
        process.exit(1);
      }

      const outPath = path.join('assets', 'recipes', `${slug}.jpg`);
      fs.writeFileSync(outPath, buf);
      console.log(`SUCCESS: Saved ${buf.length} bytes to ${outPath}`);
      process.exit(0);
    }

    if (checkData.faulted || checkData.status === 'faulted') {
      console.error('Generation faulted');
      process.exit(1);
    }
  }

  console.error('Timeout waiting for generation');
  process.exit(1);
}

main().catch(err => { console.error(err); process.exit(1); });