// Generate image using free HuggingFace inference API
import fs from 'node:fs';

const PROMPT = `Professional editorial food photography of a Miso Caramel Banana Tart on a ceramic plate on rustic wood surface. A golden fluted tart with caramelised banana slices visible through glossy miso caramel filling, dark chocolate drizzle on top, sprinkle of flaky sea salt. 45-degree angle, warm natural daylight, shallow depth of field. No text no logos no hands no people`;

const OUT = 'assets/recipes/miso-caramel-banana-tart-christine-manfield.jpg';

// Try HuggingFace free inference API (stable-diffusion-xl-base-1.0)
const models = [
  'stabilityai/stable-diffusion-xl-base-1.0',
  'runwayml/stable-diffusion-v1-5',
  'stabilityai/stable-diffusion-2-1',
  'black-forest-labs/FLUX.1-schnell',
];

for (const model of models) {
  console.log(`Trying HuggingFace model: ${model}...`);
  try {
    const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        inputs: PROMPT,
        parameters: {
          num_inference_steps: 30,
          width: 1024,
          height: 1024,
        }
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.log(`  ${model}: ${res.status} - ${body.slice(0, 200)}`);
      // If model is loading, wait and retry
      if (res.status === 503) {
        const estimated = body.match(/estimated_time.*?(\d+)/);
        const waitSec = estimated ? Math.min(parseInt(estimated[1]), 120) : 60;
        console.log(`  Model loading, waiting ${waitSec}s...`);
        await new Promise(r => setTimeout(r, waitSec * 1000));
        // Retry
        const retry = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inputs: PROMPT, parameters: { num_inference_steps: 30, width: 1024, height: 1024 } }),
          signal: AbortSignal.timeout(120000),
        });
        if (!retry.ok) {
          console.log(`  Retry ${model}: ${retry.status} - ${(await retry.text()).slice(0, 200)}`);
          continue;
        }
        const retryBuf = Buffer.from(await retry.arrayBuffer());
        if (retryBuf.length > 5000) {
          fs.writeFileSync(OUT, retryBuf);
          console.log(`  ${model}: SUCCESS! Saved ${retryBuf.length} bytes`);
          process.exit(0);
        }
      }
      continue;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image')) {
      const body = await res.text();
      console.log(`  ${model}: Not an image (${contentType}) - ${body.slice(0, 200)}`);
      continue;
    }

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) {
      console.log(`  ${model}: Too small (${buf.length} bytes)`);
      continue;
    }

    fs.writeFileSync(OUT, buf);
    console.log(`  ${model}: SUCCESS! Saved ${buf.length} bytes`);
    process.exit(0);
  } catch (e) {
    console.log(`  ${model}: Error - ${e.message}`);
  }
}

console.error('All HuggingFace models failed. Trying Pollinations one more time...');
// Final Pollinations attempt
const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(PROMPT)}?width=1024&height=1024&nologo=true&seed=99999`;
try {
  const res = await fetch(pollUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    signal: AbortSignal.timeout(120000),
  });
  if (res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 5000) {
      fs.writeFileSync(OUT, buf);
      console.log(`Pollinations SUCCESS! Saved ${buf.length} bytes`);
      process.exit(0);
    }
  }
  console.log(`Pollinations: ${res.status}`);
} catch (e) {
  console.log(`Pollinations: ${e.message}`);
}

console.error('FAILED: All image generation providers unavailable');
process.exit(1);