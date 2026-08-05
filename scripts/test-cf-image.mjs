#!/usr/bin/env node
// Try Cloudflare Workers AI for image generation
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

async function main() {
  // Get account ID
  const accRes = await fetch('https://api.cloudflare.com/client/v4/accounts', {
    headers: { Authorization: `Bearer ${CF_TOKEN}` }
  });
  const accData = await accRes.json();
  if (!accData.success || !accData.result || accData.result.length === 0) {
    console.error('Failed to get CF accounts:', JSON.stringify(accData).slice(0, 500));
    process.exit(1);
  }
  const accountId = accData.result[0].id;
  console.log('CF Account ID:', accountId);

  // Try @cf/stabilityai/stable-diffusion-xl-base-1.0
  const prompt = 'Professional editorial food photography of grilled lamb with chimichurri. Sliced lamb medallions with vibrant green chimichurri sauce, on a ceramic plate, rustic wood surface, natural daylight, 45-degree angle. No text, no logos, no hands, no people.';
  
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`;
  console.log('Trying:', url);
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt }),
  });
  
  console.log('Status:', res.status, res.statusText);
  const ct = res.headers.get('content-type');
  console.log('Content-Type:', ct);
  
  if (!res.ok) {
    const text = await res.text();
    console.error('Error:', text.slice(0, 500));
    process.exit(1);
  }
  
  const buf = Buffer.from(await res.arrayBuffer());
  console.log('Response size:', buf.length, 'bytes');
  
  // Check if it's JSON error
  if (ct && ct.includes('json')) {
    const text = buf.toString('utf8');
    console.error('JSON response:', text.slice(0, 500));
    process.exit(1);
  }
  
  const outFile = '/tmp/cf-test-image.jpg';
  const { writeFileSync } = await import('fs');
  writeFileSync(outFile, buf);
  console.log('Saved to', outFile);
}

main().catch(e => { console.error(e); process.exit(1); });