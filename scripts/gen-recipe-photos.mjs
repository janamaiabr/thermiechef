// Gera uma FOTO ÚNICA e coerente para cada receita usando Gemini 2.5 Flash Image
// (mesma engine "Nano Banana" da Bruxa). Salva em assets/recipes/<slug>.jpg e
// aponta o campo image de cada receita pra ela. Sem repetição, sem foto errada.
//
// Pré-requisito: export GOOGLE_AI_STUDIO_API_KEY="AIza..."  (https://aistudio.google.com)
//
// Uso:
//   node scripts/gen-recipe-photos.mjs --slug beef-bourguignon-julia-child   # testa 1
//   node scripts/gen-recipe-photos.mjs --limit 5                              # 5 primeiras sem foto
//   node scripts/gen-recipe-photos.mjs                                       # todas que faltam
//   node scripts/gen-recipe-photos.mjs --force                               # regera todas
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";

const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const KEY = process.env.GOOGLE_AI_STUDIO_API_KEY;
if (!KEY) { console.error("Defina GOOGLE_AI_STUDIO_API_KEY primeiro (https://aistudio.google.com)."); process.exit(1); }

const args = process.argv.slice(2);
const only = (args.find(a=>a.startsWith("--slug="))||"").split("=")[1] || (args.includes("--slug") ? args[args.indexOf("--slug")+1] : null);
const limit = args.includes("--limit") ? parseInt(args[args.indexOf("--limit")+1]) : Infinity;
const force = args.includes("--force");

const OUTDIR = "assets/recipes";
mkdirSync(OUTDIR, { recursive: true });

function promptFor(d){
  const ings = (d.ingredients||[]).slice(0,8).map(i=>typeof i==="string"?i:(i.item||i.name||"")).filter(Boolean).join(", ");
  return `Professional food photography of "${d.title}", a ${d.cuisine||""} ${d.category||"dish"}.
Key ingredients: ${ings}.
Editorial cookbook style, natural soft daylight, shallow depth of field, on a beautiful ceramic plate or bowl on a rustic wooden or linen surface, garnished and freshly served, appetising and realistic. Overhead or 45-degree angle. Warm, inviting tones.
IMPORTANT: show ONLY the finished dish as it really looks. No text, no words, no logos, no hands, no Thermomix machine, no packaging. Square 1:1, high resolution.`;
}

async function gen(d, slug){
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`;
  const body = { contents: [{ parts: [{ text: promptFor(d) }] }] };
  const res = await fetch(url, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0,300)}`);
  const data = await res.json();
  const part = data?.candidates?.[0]?.content?.parts?.find(p=>p.inlineData?.data);
  if (!part) throw new Error("Gemini não retornou imagem: "+JSON.stringify(data).slice(0,300));
  writeFileSync(`${OUTDIR}/${slug}.jpg`, Buffer.from(part.inlineData.data, "base64"));
}

const files = readdirSync("recipes/data").filter(f=>f.endsWith(".json"));
let done=0, skipped=0, failed=0;
for (const f of files){
  const slug = f.replace(/\.json$/,"");
  if (only && slug !== only) continue;
  if (done >= limit) break;
  const path = "recipes/data/"+f;
  const d = JSON.parse(readFileSync(path,"utf8"));
  const out = `${OUTDIR}/${slug}.jpg`;
  if (existsSync(out) && !force) { skipped++; continue; }
  try {
    process.stdout.write(`Gerando ${slug}... `);
    await gen(d, slug);
    d.image = `recipes/${slug}.jpg`;            // imagem própria da receita
    writeFileSync(path, JSON.stringify(d,null,2));
    console.log("ok");
    done++;
    await new Promise(r=>setTimeout(r, 1500));  // gentil com a API
  } catch(e){ console.log("FALHOU:", e.message); failed++; }
}
console.log(`\nFeito: ${done} geradas, ${skipped} já existiam, ${failed} falharam.`);
console.log("Depois: rode 'node scripts/build.mjs' e confira em /recipes antes de publicar.");
