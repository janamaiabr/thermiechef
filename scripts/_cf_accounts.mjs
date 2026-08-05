import fs from 'fs';
const CF_TOKEN = process.env.CF_TOKEN;
if (!CF_TOKEN) { console.error('No CF_TOKEN'); process.exit(1); }
const res = await fetch('https://api.cloudflare.com/client/v4/accounts', {
  headers: { 'Authorization': `Bearer ${CF_TOKEN}` }
});
const data = await res.json();
if (data.result) {
  for (const a of data.result) {
    console.log(`${a.id} ${a.name}`);
  }
} else {
  console.log(JSON.stringify(data, null, 2).slice(0, 500));
}