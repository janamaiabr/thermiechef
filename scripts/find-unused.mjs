import fs from 'node:fs';
import path from 'node:path';
const DATA_DIR = path.join(process.cwd(), 'recipes', 'data');
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
const chefs = new Set();
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'));
  if (d.inspiredBy?.chef) chefs.add(d.inspiredBy.chef.toLowerCase());
}
const candidates = [
  ['Alice Waters', 'summer vegetable pasta'],
  ['Thomas Keller', 'roast chicken'],
  ['Samin Nosrat', 'buttermilk chicken'],
  ['Hetty McKinnon', 'crispy rice salad'],
  ['Nagi Maehashi', 'teriyaki chicken'],
  ['J. Kenji López-Alt', 'crispy potatoes'],
  ['Claudia Fleming', 'gingerbread cake'],
  ['Ravinder Bhogal', 'cauliflower pilaf'],
  ['Meera Sodha', 'aubergine curry'],
  ['Rachel Roddy', 'pasta e ceci'],
  ['Sohla El-Waylly', 'spiced tomato eggs'],
  ['Nigel Slater', 'mushroom pasta'],
  ['Dan Hong', 'prawn toast'],
  ['Nobu Matsuhisa', 'miso cod'],
  ['Fuchsia Dunlop', 'mapo tofu'],
  ['Marcella Hazan', 'tomato sauce'],
  ['Anna Del Conte', 'minestrone'],
  ['Ruth Rogers', 'tomato bread soup'],
  ['Antonio Carluccio', 'mushroom risotto'],
  ['Skye Gyngell', 'roasted vegetable salad'],
  ['Edna Lewis', 'corn pudding'],
  ['Dorie Greenspan', 'yoghurt cake'],
  ['Rose Levy Beranbaum', 'vanilla sponge cake'],
  ['David Lebovitz', 'chocolate sorbet'],
  ['Mimi Thorisson', 'apple tart'],
  ['Anissa Helou', 'lentil soup'],
  ['Elizabeth David', 'ratatouille'],
  ['Tessa Kiros', 'cinnamon buns'],
  ['Sophie Grigson', 'lemon potatoes'],
  ['Karen Martini', 'eggplant parmigiana'],
  ['Kylie Millar', 'passionfruit pavlova'],
  ['Peter Gilmore', 'cauliflower cream'],
  ['Josh Niland', 'fish kofta'],
  ['Christine Manfield', 'spiced pumpkin soup'],
  ['Luke Nguyen', 'lemongrass chicken'],
];
const unused = candidates.filter(([c]) => !chefs.has(c.toLowerCase()));
console.log('Unused candidates:');
for (const [c, d] of unused) console.log(`  ${c} - ${d}`);
console.log(`Total: ${unused.length} unused out of ${candidates.length}`);