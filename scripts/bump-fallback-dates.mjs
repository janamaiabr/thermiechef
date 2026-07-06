// Bump the 10 fallback recipes to future dates starting tomorrow.
// This is needed because seed-fallback-queue skips existing files even if their dates are past.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "recipes", "data");
const TODAY = new Date();
const tomorrow = new Date(TODAY);
tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

const fallbackSlugs = [
  "summer-vegetable-pasta-alice-waters",
  "crispy-potatoes-j-kenji-lopez-alt",
  "aubergine-curry-meera-sodha",
  "pasta-e-ceci-rachel-roddy",
  "prawn-toast-dan-hong",
  "mapo-tofu-fuchsia-dunlop",
  "yoghurt-cake-dorie-greenspan",
  "lentil-soup-anissa-helou",
  "ratatouille-elizabeth-david",
  "lemongrass-chicken-luke-nguyen",
];

let bumped = 0;
for (let i = 0; i < fallbackSlugs.length; i++) {
  const file = join(DATA, `${fallbackSlugs[i]}.json`);
  let recipe;
  try {
    recipe = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    console.log(`SKIP ${fallbackSlugs[i]} (file not found)`);
    continue;
  }
  const newDate = new Date(Date.UTC(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth(), tomorrow.getUTCDate()));
  newDate.setUTCDate(newDate.getUTCDate() + i);
  const dateStr = newDate.toISOString().slice(0, 10);
  recipe.datePublished = dateStr;
  writeFileSync(file, `${JSON.stringify(recipe, null, 2)}\n`);
  bumped++;
  console.log(`BUMP ${fallbackSlugs[i]} → ${dateStr}`);
}
console.log(`\nDone: ${bumped} recipes bumped to future dates.`);