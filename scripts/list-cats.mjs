import fs from 'fs';
import path from 'path';
const dir = 'recipes/data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const cats = new Set();
const cuisines = new Set();
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  cats.add(d.category);
  cuisines.add(d.cuisine);
  if (d.filters) d.filters.forEach(x => cats.add(x));
}
console.log('Categories:', [...cats].sort().join(', '));
console.log('Cuisines:', [...cuisines].sort().join(', '));