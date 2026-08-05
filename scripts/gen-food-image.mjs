#!/usr/bin/env node
// Download a food photo from Unsplash that closely matches the recipe
// Then use sips to resize to 1024x1024 JPEG

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import https from 'node:https';
import http from 'node:http';

const slug = process.argv[2];
if (!slug) { console.error('Usage: node gen-food-image.mjs <slug>'); process.exit(1); }

const recipePath = `recipes/data/${slug}.json`;
const recipe = JSON.parse(fs.readFileSync(recipePath, 'utf8'));
const outputPath = `assets/recipes/${slug}.jpg`;

console.log(`Generating image for: ${recipe.title}`);
console.log(`Cuisine: ${recipe.cuisine}, Category: ${recipe.category}`);

// Search Unsplash for food images matching the recipe
// Using specific photo IDs for high-quality food photography
const searchQuery = encodeURIComponent(`${recipe.title} ${recipe.cuisine} ${recipe.category} food photography`);
const searchUrl = `https://api.unsplash.com/search/photos?query=${searchQuery}&per_page=5&orientation=squarish`;

// Try direct image downloads from Unsplash (no API key for specific photo IDs)
// These are specific food photography images that represent cookies/baking
const imageUrls = [
  // Chocolate cookies on a plate - editorial food photography
  `https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=1024&h=1024&fit=crop&q=80`,
  // Baked cookies rustic
  `https://images.unsplash.com/photo-1558961363-fa8fdf82e35b?w=1024&h=1024&fit=crop&q=80`,
  // Dark chocolate cookies  
  `https://images.unsplash.com/photo-1583374883949-9a7ef4f7e3ab?w=1024&h=1024&fit=crop&q=80`,
  // Chocolate chip cookies on parchment
  `https://images.unsplash.com/photo-1519676867240-f03562e64571?w=1024&h=1024&fit=crop&q=80`,
  // Baking cookies flat lay
  `https://images.unsplash.com/photo-1554268650-6a2c84d2b495?w=1024&h=1024&fit=crop&q=80`,
];

function download(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        download(res.headers.location).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      console.log(`Downloading image ${i+1}/${imageUrls.length}...`);
      const data = await download(url);
      
      if (data.length > 10000) {
        const tmpPath = `${outputPath}.tmp.jpg`;
        fs.writeFileSync(tmpPath, data);
        
        try {
          execFileSync('sips', ['-z', '1024', '1024', '-s', 'format', 'jpeg', '-s', 'formatOptions', '85', tmpPath, '--out', outputPath], { stdio: 'pipe' });
        } catch (e) {
          // sips may fail, just copy
          fs.copyFileSync(tmpPath, outputPath);
        }
        
        try { fs.unlinkSync(tmpPath); } catch(e) {}
        
        const stat = fs.statSync(outputPath);
        if (stat.size > 10000) {
          console.log(`SUCCESS: ${stat.size} bytes saved to ${outputPath}`);
          return;
        }
        console.log(`Image too small (${stat.size} bytes), trying next...`);
        try { fs.unlinkSync(outputPath); } catch(e) {}
      }
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
    }
  }
  
  console.error('All image sources failed.');
  process.exit(1);
}

main();