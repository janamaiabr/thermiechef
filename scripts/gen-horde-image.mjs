// Generate image using Stable Horde (free, community-powered)
import fs from 'node:fs';

const PROMPT = `Professional editorial food photography of a Miso Caramel Banana Tart on a ceramic plate on rustic wood surface. A golden fluted tart with caramelised banana slices visible through glossy miso caramel filling, dark chocolate drizzle on top, sprinkle of flaky sea salt. 45-degree angle, warm natural daylight, shallow depth of field. No text no logos no hands no people`;

const OUT = 'assets/recipes/miso-caramel-banana-tart-christine-manfield.jpg';

async function tryStableHorde() {
  console.log('Submitting to Stable Horde...');
  const submitRes = await fetch('https://stablehorde.net/api/v2/generate/async', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Client-Agent': 'ThermieChef:1.0', 'apikey': '0000000000' },
    body: JSON.stringify({
      prompt: PROMPT,
      params: {
        n: 1,
        width: 768,
        height: 768,
        steps: 25,
        cfg_scale: 7,
        sampler_name: 'k_euler_a',
        seed: '7654321',
      },
      nsfw: false,
      r2: true,
      apikey: '0000000000',
    }),
  });

  if (!submitRes.ok) {
    const body = await submitRes.text();
    console.error(`Stable Horde submit failed: ${submitRes.status} - ${body.slice(0, 500)}`);
    return false;
  }

  const submitData = await submitRes.json();
  const id = submitData.id;
  console.log(`Job submitted: ${id}. Waiting for completion...`);

  // Poll for result
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000));
    const statusRes = await fetch(`https://stablehorde.net/api/v2/generate/check/${id}`, {
      headers: { 'Client-Agent': 'ThermieChef:1.0' },
    });
    const status = await statusRes.json();
    console.log(`  Check ${i + 1}: ${status.done ? 'DONE' : 'waiting'} (wait=${status.wait_time || 0}s, queue=${status.queue_position || '?'})`);

    if (status.done) {
      // Get the result
      const resultRes = await fetch(`https://stablehorde.net/api/v2/generate/status/${id}`, {
        headers: { 'Client-Agent': 'ThermieChef:1.0' },
      });
      const result = await resultRes.json();

      if (result.generations && result.generations.length > 0) {
        const gen = result.generations[0];
        const imgUrl = gen.img;
        console.log(`Downloading image from: ${imgUrl}`);

        const imgRes = await fetch(imgUrl);
        if (!imgRes.ok) {
          console.error(`Download failed: ${imgRes.status}`);
          return false;
        }

        const buf = Buffer.from(await imgRes.arrayBuffer());
        if (buf.length < 5000) {
          console.error(`Image too small: ${buf.length} bytes`);
          return false;
        }

        fs.writeFileSync(OUT, buf);
        console.log(`SUCCESS! Saved ${buf.length} bytes to ${OUT}`);
        return true;
      }
    }

    if (status.faulted) {
      console.error('Job faulted');
      return false;
    }
  }

  console.error('Timeout waiting for image');
  return false;
}

const ok = await tryStableHorde();
if (!ok) {
  console.error('Stable Horde failed');
  process.exit(1);
}