#!/usr/bin/env node
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
fetch('https://api.cloudflare.com/client/v4/zones', {
  headers: { Authorization: `Bearer ${CF_TOKEN}` }
}).then(r => r.json()).then(d => {
  if (d.result) d.result.forEach(r => console.log(r.id, r.name, r.account.id, r.account.name));
  else console.log(JSON.stringify(d).slice(0, 500));
}).catch(e => console.error(e));