// Try Prodia API for free image generation
import fs from 'node:fs';

const PROMPT = `Professional editorial food photography of a Miso Caramel Banana Tart on a ceramic plate on rustic wood surface. A golden fluted tart with caramelised banana slices visible through glossy miso caramel filling, dark chocolate drizzle on top, sprinkle of flaky sea salt. 45-degree angle, warm natural daylight, shallow depth of field. No text no logos no hands no people`;

const OUT = 'assets/recipes/miso-caramel-banana-tart-christine-manfield.jpg';

// Try Prodia free API
async function tryProdia() {
  console.log('Trying Prodia free API...');
  const url = 'https://api.prodia.com/v1/sd/generate';
  // Prodia requires an API key now, let's try the old free endpoint
  return false;
}

// Try Together AI free tier
async function tryTogether() {
  console.log('Trying Together AI...');
  const TOGETHER_KEY = process.env.TOGETHER_API_KEY;
  if (!TOGETHER_KEY) {
    console.log('No Together API key');
    return false;
  }
  // Not available
  return false;
}

// Try direct FLUX.1-schnell via HuggingFace with accept header
async function tryHuggingFaceDirect() {
  const models = [
    'black-forest-labs/FLUX.1-schnell',
    'stabilityai/stable-diffusion-xl-base-1.0',
  ];

  for (const model of models) {
    console.log(`Trying HuggingFace: ${model}...`);
    try {
      const res = await fetch(`https://router.huggingface.co/hf-inference/models/${model}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'image/jpeg',
        },
        body: JSON.stringify({
          inputs: PROMPT,
          parameters: {
            num_inference_steps: 25,
            width: 1024,
            height: 1024,
          }
        }),
        signal: AbortSignal.timeout(120000),
      });

      const contentType = res.headers.get('content-type') || '';
      console.log(`  Response: ${res.status}, type: ${contentType}`);

      if (res.status === 503) {
        const body = await res.text();
        const match = body.match(/estimated_time.*?(\d+\.?\d*)/);
        const wait = match ? Math.min(parseFloat(match[1]), 120) : 60;
        console.log(`  Model loading, waiting ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        console.log(`  Failed: ${body.slice(0, 300)}`);
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 5000) {
        console.log(`  Too small: ${buf.length} bytes`);
        continue;
      }

      fs.writeFileSync(OUT, buf);
      console.log(`  SUCCESS! Saved ${buf.length} bytes`);
      return true;
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
  return false;
}

// Try with HuggingFace access token from environment
async function tryHuggingFaceWithToken() {
  const HF_TOKEN = process.env.HF_TOKEN || process.env.HUGGING_FACE_HUB_TOKEN;
  if (!HF_TOKEN) {
    console.log('No HuggingFace token');
    return false;
  }
  // Same as above but with auth
  console.log('Trying HuggingFace with token...');
  return false;
}

// Pollinations with model=flux-realism (different routing)
async function tryPollinationsFluxRealism() {
  console.log('Trying Pollinations flux-realism...');
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(PROMPT)}?width=768&height=768&model=flux-realism&nologo=true&seed=7777777`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36', 'Accept': 'image/*' },
      signal: AbortSignal.timeout(90000),
    });
    console.log(`  Status: ${res.status}, type: ${res.headers.get('content-type')}`);
    if (!res.ok) {
      const body = await res.text();
      console.log(`  Failed: ${body.slice(0, 300)}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 5000) {
      console.log(`  Too small: ${buf.length} bytes`);
      return false;
    }
    fs.writeFileSync(OUT, buf);
    console.log(`  SUCCESS! Saved ${buf.length} bytes`);
    return true;
  } catch (e) {
    console.log(`  Error: ${e.message}`);
    return false;
  }
}

// Try Segmind (has free tier)
async function trySegmind() {
  console.log('Trying Segmind...');
  // No free tier without key
  return false;
}

// Main
console.log('=== Starting image generation attempts ===');
const providers = [tryHuggingFaceDirect, tryPollinationsFluxRealism];
for (const provider of providers) {
  const ok = await provider();
  if (ok) {
    console.log('Image generation succeeded!');
    process.exit(0);
  }
}

console.error('All image generation providers failed');
process.exit(1);