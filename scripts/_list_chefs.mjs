import fs from 'fs';
import path from 'path';
const dir = 'recipes/data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const chefs = new Map();
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  const c = d.inspiredBy?.chef || '?';
  const dish = d.inspiredBy?.dish || '?';
  if (!chefs.has(c)) chefs.set(c, []);
  chefs.get(c).push(dish);
}
for (const [c, dishes] of chefs) {
  console.log(c + ': ' + dishes.join(', '));
}