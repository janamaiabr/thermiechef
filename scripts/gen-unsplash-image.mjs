#!/usr/bin/env node
// Generate food image using UploadPost API (from keychain) - they might have image generation
// Or use a free Unsplash image as source and transform with ImageMagick
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-unsplash-image.mjs <slug>'); process.exit(1); }

const ROOT = process.cwd();
const recipeFile = path.join(ROOT, 'recipes', 'data', `${slug}.json`);
const outFile = path.join(ROOT, 'assets', 'recipes', `${slug}.jpg`);

if (!fs.existsSync(recipeFile)) { console.error(`Recipe not found: ${recipeFile}`); process.exit(1); }

const recipe = JSON.parse(fs.readFileSync(recipeFile, 'utf8'));

// Use Unsplash API (free, no key needed for search) to find a relevant food photo
// Then download and resize it
const searchTerm = encodeURIComponent(`${recipe.title} food ${recipe.cuisine} cuisine`);
const unsplashUrl = `https://api.unsplash.com/search/photos?query=${searchTerm}&per_page=5&orientation=squarish`;

console.log(`Searching Unsplash for: ${recipe.title}`);

// Unsplash allows limited requests without API key using the source redirect
// Try direct source URL format: https://source.unsplash.com/1024x1024/?<query>
// Note: source.unsplash.com was deprecated. Let's try the API approach instead.

// Method: Use Unsplash source redirect (still works for some queries)
const sourceUrl = `https://source.unsplash.com/1024x1024/?${encodeURIComponent(recipe.cuisine + ' ' + recipe.title + ' food')}`;

console.log(`  Trying Unsplash source: ${sourceUrl.slice(0, 80)}...`);

try {
  const res = await fetch(sourceUrl, {
    redirect: 'follow',
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(30000),
  });
  
  if (!res.ok) {
    console.error(`  Unsplash returned ${res.status}`);
  } else {
    const buf = Buffer.from(await res.arrayBuffer());
    console.log(`  Got ${buf.length} bytes from Unsplash`);
    
    if (buf.length > 10000) {
      // Save as temp then convert to JPG
      const tmpFile = outFile.replace('.jpg', '.tmp');
      fs.writeFileSync(tmpFile, buf);
      try {
        execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', '1024', tmpFile, '--out', outFile], { stdio: 'ignore' });
        fs.unlinkSync(tmpFile);
      } catch {
        // If sips fails, try magick convert
        try {
          execFileSync('magick', [tmpFile, '-resize', '1024x1024^', '-gravity', 'center', '-extent', '1024x1024', '-quality', '85', outFile], { stdio: 'ignore' });
          fs.unlinkSync(tmpFile);
        } catch {
          fs.renameSync(tmpFile, outFile);
        }
      }
      
      const finalSize = fs.statSync(outFile).size;
      if (finalSize > 10000) {
        console.log(`✓ Saved ${outFile} (${finalSize} bytes) via Unsplash`);
        process.exit(0);
      } else {
        console.error(`  Final image too small: ${finalSize}`);
        try { fs.unlinkSync(outFile); } catch {}
      }
    } else {
      console.error(`  Image too small: ${buf.length} bytes`);
    }
  }
} catch (err) {
  console.error(`  Unsplash source failed: ${err.message}`);
}

// Method 2: Try Unsplash with direct photo API  
// Use a known good food photo from Unsplash (royalty-free)
const fallbackSearchTerms = [
  'grilled-lamb-argentine',
  'chimichurri-lamb-food',
  'argentine-grilled-meat',
];

for (const term of fallbackSearchTerms) {
  try {
    console.log(`  Trying Unsplash photo: ${term}`);
    const url = `https://source.unsplash.com/1024x1024/?${term}`;
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) continue;
    
    const tmpFile = outFile.replace('.jpg', '.tmp');
    fs.writeFileSync(tmpFile, buf);
    try {
      execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', '1024', tmpFile, '--out', outFile], { stdio: 'ignore' });
      fs.unlinkSync(tmpFile);
    } catch {
      fs.renameSync(tmpFile, outFile);
    }
    
    const finalSize = fs.statSync(outFile).size;
    if (finalSize > 10000) {
      console.log(`✓ Saved ${outFile} (${finalSize} bytes) via Unsplash fallback`);
      process.exit(0);
    }
  } catch (err) {
    console.error(`  Unsplash ${term} failed: ${err.message}`);
  }
}

console.error('✗ All Unsplash methods failed');
process.exit(1);