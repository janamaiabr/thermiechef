import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const DATA_DIR = path.join(ROOT, 'recipes', 'data');
const sourcePath = path.join(DATA_DIR, 'crispy-rice-salad-hetty-mckinnon.json');
const tempSlug = 'photo-policy-test-unique-recipe';
const tempPath = path.join(DATA_DIR, `${tempSlug}.json`);

function runValidate() {
  try {
    execFileSync('node', ['scripts/validate-site.mjs'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ok: true, output: '' };
  } catch (err) {
    return {
      ok: false,
      output: `${err.stdout || ''}${err.stderr || ''}`,
    };
  }
}

try {
  const recipe = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  recipe.slug = tempSlug;
  recipe.title = 'Photo Policy Test Unique Recipe';
  recipe.description = 'A Thermomix validation fixture with enough description text to prove duplicate fallback photos are rejected.';
  recipe.inspiredBy = { chef: 'Photo Policy Test Chef', dish: 'unique validation dish' };
  recipe.datePublished = '2099-12-31';
  recipe.image = 'hero-table.jpg';
  recipe.photoStatus = 'needs_review';
  recipe.imageApproved = false;
  delete recipe.pendingImage;
  delete recipe.photoPrompt;
  fs.writeFileSync(tempPath, `${JSON.stringify(recipe, null, 2)}\n`);

  const result = runValidate();
  if (result.ok || !result.output.includes('recipe must use a unique generated photo')) {
    console.error(result.output);
    throw new Error('validate-site must reject published recipes using repeated hero-table fallback photos');
  }
  console.log('✅ photo policy rejects repeated fallback photos');
} finally {
  fs.rmSync(tempPath, { force: true });
}
