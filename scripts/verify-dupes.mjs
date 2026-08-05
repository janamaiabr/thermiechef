const fs=require('fs'), path=require('path'), crypto=require('crypto');
const dir='recipes/data', assetDir='assets';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json'));
const maps={slug:new Map(),title:new Map(),image:new Map(),hash:new Map()};
const bad=[]; const add=(m,k,v)=>{ if(!k)return; (m.get(k)||m.set(k,[]).get(k)).push(v); };
for (const f of files) {
 const p=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
 const expected=`recipes/${p.slug}.jpg`;
 add(maps.slug,p.slug,f); add(maps.title,(p.title||'').toLowerCase().trim(),f); add(maps.image,p.image,f);
 if(p.image!==expected) bad.push(`${f}: wrong image path`);
 if(p.photoStatus!=='auto_generated') bad.push(`${f}: wrong photoStatus`);
 if(p.imageApproved!==true) bad.push(`${f}: imageApproved not true`);
 if(p.pendingImage) bad.push(`${f}: pendingImage present`);
 const img=path.join(assetDir,p.image||'');
 if(!fs.existsSync(img)) bad.push(`${f}: missing image`); else add(maps.hash,crypto.createHash('sha256').update(fs.readFileSync(img)).digest('hex'),f);
 if(!String(p.photoPrompt||'').toLowerCase().includes(String(p.title||'').toLowerCase())) bad.push(`${f}: prompt missing title`);
}
const dup=(m)=>[...m.entries()].filter(([k,v])=>k&&v.length>1);
if(dup(maps.slug).length||dup(maps.title).length||dup(maps.image).length||dup(maps.hash).length||bad.length){ console.error({duplicateSlugs:dup(maps.slug),duplicateTitles:dup(maps.title),duplicateImagePaths:dup(maps.image),duplicateImageHashes:dup(maps.hash),bad}); process.exit(1); }
console.log(`OK ${files.length} recipes; no duplicate slugs/titles/image paths/image hashes; all photos final and recipe-specific.`);