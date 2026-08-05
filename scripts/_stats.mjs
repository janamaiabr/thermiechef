import fs from 'fs';
const files = fs.readdirSync('recipes/data').filter(f => f.endsWith('.json'));
const recipes = files.map(f => JSON.parse(fs.readFileSync(`recipes/data/${f}`, 'utf8')));
const chefs = new Set(recipes.map(r => r.inspiredBy.chef));
const cats = {};
recipes.forEach(r => { cats[r.category] = (cats[r.category] || 0) + 1; });
console.log('Total recipes:', recipes.length);
console.log('Unique chefs:', chefs.size);
console.log('Categories:', JSON.stringify(cats));