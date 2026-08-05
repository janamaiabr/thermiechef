import fs from 'fs';
import path from 'path';

const dir = 'recipes/data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
const data = files.map(f => {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  return {
    slug: d.slug,
    title: (d.title || '').toLowerCase(),
    chef: (d.inspiredBy?.chef || '').toLowerCase(),
    dish: (d.inspiredBy?.dish || '').toLowerCase()
  };
});
data.forEach(d => console.log(`${d.slug}|${d.title}|${d.chef}|${d.dish}`));