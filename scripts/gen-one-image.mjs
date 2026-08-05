// Generate image for the miso caramel banana tart using multiple fallback providers
import fs from 'node:fs';

const PROMPT = `Professional editorial food photography of a Miso Caramel Banana Tart on a ceramic plate on rustic wood surface. A golden fluted tart with caramelised banana slices visible through glossy miso caramel filling, dark chocolate drizzle on top, sprinkle of flaky sea salt. 45-degree angle, warm natural daylight, shallow depth of field. No text, no logos, no hands, no people, no Thermomix machine.`;

const OUT = 'assets/recipes/miso-caramel-banana-tart-christine-manfield.jpg';

async function tryPollinations() {
  // Try different model endpoints
  const models = ['flux', 'flux-realism', 'flux-anime', 'flux-3d', 'flux-cablyai', 'turbo'];
  for (const model of models) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(PROMPT)}?width=1024&height=1024&model=${model}&nologo=true&seed=${Date.now()}`;
    console.log(`Trying Pollinations model: ${model}...`);
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const body = await res.text();
        console.log(`  ${model}: ${res.status} - ${body.slice(0, 200)}`);
        continue;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('image') && !contentType.includes('octet-stream')) {
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
      return true;
    } catch (e) {
      console.log(`  ${model}: Error - ${e.message}`);
    }
  }
  return false;
}

async function tryStability() {
  // Try Stability AI free tier (unlikely but worth trying)
  return false;
}

// Main
console.log('Attempting image generation...');
const ok = await tryPollinations();
if (ok) {
  console.log('Done! Image saved to', OUT);
} else {
  console.error('All providers failed. Trying one more time with delay...');
  await new Promise(r => setTimeout(r, 5000));
  const ok2 = await tryPollinations();
  if (ok2) {
    console.log('Done! Image saved to', OUT);
  } else {
    console.error('FAILED: Could not generate image with any provider');
    process.exit(1);
  }
}