#!/usr/bin/env node
/**
 * Adds Article JSON-LD schema to all recipe HTML files.
 * Extracts data from existing Recipe schema and creates Article schema alongside it.
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const recipesDir = join(process.cwd(), 'recipes');
const files = readdirSync(recipesDir).filter(f => f.endsWith('.html'));

let added = 0;
let skipped = 0;

for (const file of files) {
  const filepath = join(recipesDir, file);
  let html = readFileSync(filepath, 'utf-8');

  // Skip if already has Article schema
  if (html.includes('"@type":"Article"') || html.includes('"@type":"BlogPosting"')) {
    skipped++;
    continue;
  }

  // Extract data from existing Recipe schema
  const recipeMatch = html.match(/<script type="application\/ld\+json">({[^]*?"@type":"Recipe"[^]*?})<\/script>/);
  if (!recipeMatch) {
    console.log(`⚠ No Recipe schema found in ${file}`);
    skipped++;
    continue;
  }

  let recipeData;
  try {
    recipeData = JSON.parse(recipeMatch[1]);
  } catch (e) {
    console.log(`⚠ Could not parse Recipe schema in ${file}: ${e.message}`);
    skipped++;
    continue;
  }

  // Build Article schema from Recipe data
  const articleSchema = {
    "@context": "https://schema.org/",
    "@type": "Article",
    "headline": recipeData.name || "ThermieChef Recipe",
    "image": recipeData.image || [],
    "datePublished": recipeData.datePublished || "2026-06-21",
    "dateModified": recipeData.datePublished || "2026-06-21",
    "author": {
      "@type": "Person",
      "name": "Chef Aly",
      "url": "https://thermiechef.com.au/#about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ThermieChef",
      "logo": {
        "@type": "ImageObject",
        "url": "https://thermiechef.com.au/apple-touch-icon.png"
      }
    },
    "description": recipeData.description || "",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": recipeData.mainEntityOfPage || `https://thermiechef.com.au/recipes/${file}`
    },
    "articleSection": "Recipes",
    "keywords": recipeData.keywords || "Thermomix recipe"
  };

  const articleJsonLd = `<script type="application/ld+json">${JSON.stringify(articleSchema)}</script>`;

  // Insert after the Recipe schema script
  const recipeScriptEnd = html.indexOf('</script>', html.indexOf('"@type":"Recipe"')) + '</script>'.length;
  if (recipeScriptEnd > 0) {
    html = html.slice(0, recipeScriptEnd) + '\n' + articleJsonLd + html.slice(recipeScriptEnd);
    writeFileSync(filepath, html, 'utf-8');
    added++;
  } else {
    console.log(`⚠ Could not find insertion point in ${file}`);
    skipped++;
  }
}

console.log(`\n✅ Added Article schema to ${added} recipe files`);
console.log(`⏭ Skipped ${skipped} files`);