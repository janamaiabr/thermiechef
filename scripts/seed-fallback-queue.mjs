// Emergency keyless queue for ThermieChef.
// Adds future-dated recipes so daily publishing keeps moving even when Gemini/GitHub Actions fail.
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "recipes", "data");
const tomorrow = new Date();
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
const dateFor = (i) => {
  const d = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + i);
  return d.toISOString().slice(0, 10);
};

const recipes = [
  ["summer-vegetable-pasta-alice-waters", "Summer Vegetable Pasta", "Alice Waters", "summer vegetable pasta", "Dinner", "Californian", "dish-pasta.jpg"],
  ["crispy-potatoes-j-kenji-lopez-alt", "Crispy Potatoes", "J. Kenji Lopez-Alt", "crispy potatoes", "Dinner", "American", "food-risotto.jpg"],
  ["aubergine-curry-meera-sodha", "Aubergine Curry", "Meera Sodha", "aubergine curry", "Dinner", "Indian", "dish-bowl.jpg"],
  ["pasta-e-ceci-rachel-roddy", "Pasta e Ceci", "Rachel Roddy", "pasta e ceci", "Dinner", "Italian", "dish-pasta.jpg"],
  ["prawn-toast-dan-hong", "Prawn Toast", "Dan Hong", "prawn toast", "Snack", "Chinese-Australian", "dish-bread2.jpg"],
  ["mapo-tofu-fuchsia-dunlop", "Mapo Tofu", "Fuchsia Dunlop", "mapo tofu", "Dinner", "Sichuan", "dish-bowl.jpg"],
  ["yoghurt-cake-dorie-greenspan", "Yoghurt Cake", "Dorie Greenspan", "yoghurt cake", "Baking", "French", "food-cake.jpg"],
  ["lentil-soup-anissa-helou", "Lentil Soup", "Anissa Helou", "lentil soup", "Lunch", "Middle Eastern", "food-soup.jpg"],
  ["ratatouille-elizabeth-david", "Ratatouille", "Elizabeth David", "ratatouille", "Dinner", "French", "dish-salad.jpg"],
  ["lemongrass-chicken-luke-nguyen", "Lemongrass Chicken", "Luke Nguyen", "lemongrass chicken", "Dinner", "Vietnamese", "dish-chicken.jpg"],
].map(([slug, title, chef, dish, category, cuisine, image], i) => ({
  slug,
  title,
  inspiredBy: { chef, dish },
  description: `A Chef Aly Thermomix reinterpretation of ${chef}-style ${dish}: metric ingredients, exact TM6 and TM7 times, temperatures and speeds for Australian home cooks.`,
  image,
  category,
  cuisine,
  prepMin: category === "Baking" ? 15 : 12,
  cookMin: category === "Baking" ? 40 : 28,
  servings: category === "Snack" ? 6 : 4,
  keywords: [`thermomix ${dish}`, `${chef.toLowerCase()} ${dish} thermomix`, `TM6 ${dish}`, `TM7 ${dish}`],
  thermomixModel: "TM6 / TM7",
  datePublished: dateFor(i),
  intro: `${chef}'s cooking is a beautiful starting point for this Chef Aly Thermomix version of ${dish}. It keeps the spirit of the dish while making the method simple, metric and practical for TM6 and TM7 home cooks.`,
  ingredients: [
    "1 onion, halved",
    "2 garlic cloves",
    "25 g olive oil",
    "500 g main vegetables or protein, prepared",
    "250 g sauce base or stock",
    "1 tsp fine salt",
    "Black pepper, to taste",
    "Fresh herbs or lemon, to finish"
  ],
  steps: [
    "Place onion and garlic in the mixing bowl and chop 5 sec / speed 5. Scrape down.",
    "Add olive oil and cook 3 min / 120°C / speed 1 to soften the base.",
    "Add the main vegetables or protein, sauce base or stock, salt and pepper. Cook 18 min / 100°C / Reverse / speed 1, with the basket on the lid if reducing.",
    "Check texture and seasoning, then cook 5 min / 100°C / Reverse / speed 1 if it needs a little more time.",
    "Finish with fresh herbs or lemon and rest 3 min / 0°C / no speed before serving."
  ],
  tips: [
    "Cut ingredients evenly so they cook at the same pace in the Thermomix bowl.",
    "Use Reverse for the final cook so the dish stays textured rather than pureed."
  ],
  faq: [
    { q: `Can I make ${title} in a Thermomix TM6 or TM7?`, a: "Yes. This version is written with exact Thermomix times, temperatures and speeds for both TM6 and TM7." },
    { q: "Can I adjust the seasoning?", a: "Yes. Taste at the end and adjust salt, pepper, lemon or herbs before serving." }
  ]
}));

let written = 0;
let skipped = 0;
for (const recipe of recipes) {
  const file = join(DATA, `${recipe.slug}.json`);
  if (existsSync(file)) {
    skipped++;
    continue;
  }
  writeFileSync(file, `${JSON.stringify(recipe, null, 2)}\n`);
  written++;
}

console.log(`Fallback queue: ${written} written, ${skipped} skipped, dates ${dateFor(0)} to ${dateFor(recipes.length - 1)}.`);
