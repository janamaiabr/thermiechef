import { loadRecipes, nextChef } from './recipe-utils.mjs';
const existing = loadRecipes();
const target = nextChef(existing);
console.log(JSON.stringify(target));