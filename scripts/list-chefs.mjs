import fs from 'fs';
import path from 'path';
const dir = 'recipes/data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  console.log(`${d.title}|${d.inspiredBy.chef}|${d.inspiredBy.dish}`);
}