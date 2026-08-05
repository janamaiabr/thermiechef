// Try Together AI for image generation
import fs from 'node:fs';

const PROMPT = `Professional editorial food photography of a Miso Caramel Banana Tart on a ceramic plate on rustic wood surface. A golden fluted tart with caramelised banana slices visible through glossy miso caramel filling, dark chocolate drizzle on top, sprinkle of flaky sea salt. 45-degree angle, warm natural daylight, shallow depth of field. No text no logos no hands no people`;

const OUT = 'assets/recipes/miso-caramel-banana-tart-christine-manfield.jpg';

// Try together.ai with environment API key or free tier
async function tryTogether() {
  const apiKey = process.env.TOGETHER_API_KEY || process.env.TOGETHER_KEY;
  console.log('Together AI key available:', !!apiKey);
  if (!apiKey) {
    console.log('No Together API key');
    return false;
  }

  console.log('Trying Together AI (FLUX.1-schnell)...');
  try {
    const res = await fetch('https://api.together.xyz/v1/images', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: PROMPT,
        width: 1024,
        height: 1024,
        steps: 4,
        n: 1,
        response_format: 'b64_json',
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.log(`Together failed: ${res.status} - ${body.slice(0, 300)}`);
      return false;
    }

    const json = await res.json();
    if (json.data && json.data[0] && json.data[0].b64_json) {
      const buf = Buffer.from(json.data[0].b64_json, 'base64');
      fs.writeFileSync(OUT, buf);
      console.log(`SUCCESS! Saved ${buf.length} bytes`);
      return true;
    }
    console.log('No image data in response');
    return false;
  } catch (e) {
    console.log(`Error: ${e.message}`);
    return false;
  }
}

// Try Fireworks AI (free tier available)
async function tryFireworks() {
  const apiKey = process.env.FIREWORKS_API_KEY;
  console.log('Fireworks key available:', !!apiKey);
  if (!apiKey) {
    console.log('No Fireworks API key');
    return false;
  }

  console.log('Trying Fireworks AI...');
  try {
    const res = await fetch('https://api.fireworks.ai/inference/v1/image_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'stability/sdxl',
        prompt: PROMPT,
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.log(`Fireworks failed: ${res.status} - ${body.slice(0, 300)}`);
      return false;
    }

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('image')) {
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(OUT, buf);
      console.log(`SUCCESS! Saved ${buf.length} bytes`);
      return true;
    }

    const json = await res.json();
    if (json.data && json.data[0] && json.data[0].b64_json) {
      const buf = Buffer.from(json.data[0].b64_json, 'base64');
      fs.writeFileSync(OUT, buf);
      console.log(`SUCCESS! Saved ${buf.length} bytes`);
      return true;
    }
    console.log('No image data in response');
    return false;
  } catch (e) {
    console.log(`Error: ${e.message}`);
    return false;
  }
}

// Try SiliconFlow (free tier)
async function trySiliconFlow() {
  const apiKey = process.env.SILICONFLOW_API_KEY;
  console.log('SiliconFlow key available:', !!apiKey);
  if (!apiKey) {
    console.log('No SiliconFlow API key');
    return false;
  }

  console.log('Trying SiliconFlow...');
  try {
    const res = await fetch('https://api.siliconflow.cn/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: PROMPT,
        image_size: '1024x1024',
        num_inference_steps: 20,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.log(`SiliconFlow failed: ${res.status} - ${body.slice(0, 300)}`);
      return false;
    }

    const json = await res.json();
    if (json.images && json.images[0] && json.images[0].url) {
      const imgUrl = json.images[0].url;
      const imgRes = await fetch(imgUrl);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      fs.writeFileSync(OUT, buf);
      console.log(`SUCCESS! Saved ${buf.length} bytes`);
      return true;
    }
    console.log('No image data in response');
    return false;
  } catch (e) {
    console.log(`Error: ${e.message}`);
    return false;
  }
}

// Try DeepAI (free tier)
async function tryDeepAI() {
  const apiKey = process.env.DEEPAI_API_KEY;
  console.log('DeepAI key available:', !!apiKey);
  if (!apiKey) {
    console.log('No DeepAI API key, trying free endpoint...');
    // DeepAI has a free tier with limited access
    try {
      const formData = new FormData();
      formData.append('text', PROMPT);

      const res = await fetch('https://api.deepai.org/api/text2img', {
        method: 'POST',
        headers: { 'Api-Key': 'quickstart-QUdJc0habXB3VWRCSw==' }, // public demo key
        body: formData,
        signal: AbortSignal.timeout(60000),
      });

      if (!res.ok) {
        const body = await res.text();
        console.log(`DeepAI failed: ${res.status} - ${body.slice(0, 300)}`);
        return false;
      }

      const json = await res.json();
      if (json.output_url) {
        const imgRes = await fetch(json.output_url);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length > 5000) {
          fs.writeFileSync(OUT, buf);
          console.log(`SUCCESS! Saved ${buf.length} bytes`);
          return true;
        }
      }
      console.log('No valid image from DeepAI');
      return false;
    } catch (e) {
      console.log(`DeepAI error: ${e.message}`);
      return false;
    }
  }

  return false;
}

console.log('=== Starting image generation attempts v3 ===');
const providers = [tryTogether, tryFireworks, trySiliconFlow, tryDeepAI];
for (const provider of providers) {
  const ok = await provider();
  if (ok) {
    console.log('Image generation succeeded!');
    process.exit(0);
  }
}

console.error('All image generation providers failed');
process.exit(1);