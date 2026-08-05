// Direct Pollinations image generation with retry
import fs from 'node:fs';

const PROMPT = `Professional editorial food photography of a Miso Caramel Banana Tart on a ceramic plate on rustic wood surface. A golden fluted tart with caramelised banana slices visible through glossy miso caramel filling, dark chocolate drizzle on top, sprinkle of flaky sea salt. 45-degree angle, warm natural daylight, shallow depth of field. No text no logos no hands no people no Thermomix`;

const OUT = 'assets/recipes/miso-caramel-banana-tart-christine-manfield.jpg';

// Try Pollinations with explicit flux model
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(PROMPT)}?width=1024&height=1024&model=flux&nologo=true&seed=42&enhance=true`;

console.log('Fetching from Pollinations (flux)...');
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' },
  signal: AbortSignal.timeout(120000),
});

console.log(`Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}, Content-Length: ${res.headers.get('content-length')}`);

if (!res.ok) {
  const body = await res.text();
  console.error(`Error: ${body.slice(0, 500)}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
console.log(`Downloaded: ${buf.length} bytes`);

if (buf.length < 5000) {
  console.error('Image too small, possibly an error response');
  process.exit(1);
}

fs.writeFileSync(OUT, buf);
console.log(`Saved to ${OUT}: ${buf.length} bytes`);