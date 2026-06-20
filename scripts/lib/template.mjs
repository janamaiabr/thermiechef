// Shared renderers for SEO-optimised Thermomix recipe pages.
// A recipe object: { slug,title,description,image,category,cuisine,prepMin,cookMin,
//   servings,keywords[],datePublished,thermomixModel,intro,ingredients[],steps[],tips[],faq[{q,a}] }

export const SITE_NAME = "ThermieChef";
export const BUY_URL = "https://thermomix.com.au/cart/update?attributes%5Bconsultant_id%5D=63072158&attributes%5Bsource%5D=online_bb&updates%5B45183405719729%5D=1";
export const ALY_WA = "https://wa.me/61424310504";

// tracking injected into every generated page (buy attribution + page views)
const TRACK_JS = `function track(t,s){try{var p=JSON.stringify({type:t,source:s||'',path:location.pathname,ref:document.referrer||''});var b=new Blob([p],{type:'application/json'});navigator.sendBeacon?navigator.sendBeacon('/api/track',b):fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:p,keepalive:true});}catch(e){}}function trackBuy(w){track('buy_click',w);try{if(window.fbq)fbq('track','InitiateCheckout',{source:w});}catch(e){}return true;}track('page_view','recipe');`;

export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// pick an emoji for an ingredient line (first keyword match wins)
const EMOJI = [
  [/onion|shallot|leek/, "🧅"], [/garlic/, "🧄"], [/ginger/, "🫚"], [/tomato|passata/, "🍅"],
  [/mushroom/, "🍄"], [/potato/, "🥔"], [/pumpkin|squash/, "🎃"], [/carrot/, "🥕"], [/corn|sweetcorn/, "🌽"],
  [/broccoli|cauliflower/, "🥦"], [/spinach|kale|rocket|lettuce|cabbage|greens/, "🥬"], [/capsicum|pepper\b|bell pepper/, "🫑"],
  [/chilli|chili|jalape/, "🌶️"], [/avocado/, "🥑"], [/eggplant|aubergine/, "🍆"], [/cucumber|zucchini|courgette/, "🥒"],
  [/bean|chickpea|lentil|pea\b|peas/, "🫘"], [/rice|risotto|arborio/, "🍚"], [/pasta|spaghetti|noodle|macaroni/, "🍝"],
  [/flour|bread|dough|yeast|semolina/, "🌾"], [/sugar|caster|icing/, "🍬"], [/honey|maple|syrup/, "🍯"], [/salt/, "🧂"],
  [/butter/, "🧈"], [/cheese|parmesan|feta|mozzarella|ricotta|cheddar/, "🧀"], [/cream|milk|yoghurt|yogurt|custard/, "🥛"],
  [/egg/, "🥚"], [/chicken|poultry/, "🍗"], [/beef|steak|mince|veal/, "🥩"], [/pork|bacon|ham|sausage|chorizo/, "🥓"],
  [/lamb/, "🥩"], [/fish|salmon|cod|tuna|snapper/, "🐟"], [/prawn|shrimp|seafood/, "🦐"], [/oil|olive/, "🫒"],
  [/wine|vinegar/, "🍷"], [/water|stock|broth/, "💧"], [/lemon/, "🍋"], [/lime/, "🍈"], [/orange|mandarin/, "🍊"],
  [/banana/, "🍌"], [/apple/, "🍎"], [/berry|strawberr|raspberr|blueberr/, "🍓"], [/coconut/, "🥥"], [/mango/, "🥭"],
  [/chocolate|cocoa|cacao/, "🍫"], [/coffee|espresso/, "☕"], [/vanilla|cinnamon|spice|nutmeg|cumin|paprika|curry|turmeric/, "🌼"],
  [/nut|almond|walnut|cashew|peanut|pecan|hazelnut/, "🥜"], [/herb|basil|parsley|coriander|cilantro|mint|thyme|rosemary|dill|oregano/, "🌿"],
  [/tofu/, "🧊"], [/pastry|puff|filo|phyllo/, "🥐"],
];
export const ingredientEmoji = (s) => { const t = String(s || "").toLowerCase(); for (const [re, e] of EMOJI) if (re.test(t)) return e; return "🥄"; };

// initials avatar for a chef name (e.g. "Jamie Oliver" -> "JO")
export const chefInitials = (n) => { const p = String(n || "").trim().split(/\s+/); return (((p[0] || "")[0] || "") + (p.length > 1 ? (p[p.length - 1][0] || "") : "")).toUpperCase() || "★"; };
const iso = (min) => `PT${Math.max(0, Math.round(min || 0))}M`;
export const totalMin = (r) => (r.prepMin || 0) + (r.cookMin || 0);

const HEAD_CSS = `
:root{--bg:#FFFBF4;--paper:#fff;--warm:#FBEFE0;--warm-2:#F6E4CE;--terra:#DC6B3F;--terra-d:#C2542B;--green:#2F7D52;--green-d:#235E3D;--amber:#ECA23C;--ink:#2A241E;--muted:#7a6f63;--line:#EFE2CE}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:linear-gradient(180deg,#FFFDF8 0%,#FBF3E7 60%,#F7ECDA 100%);background-attachment:fixed;color:var(--ink);font-family:Inter,system-ui,sans-serif;line-height:1.65;-webkit-font-smoothing:antialiased}
.wrap{max-width:820px;margin:0 auto;padding:0 22px}
h1,h2,h3,h4{font-family:Poppins,system-ui,sans-serif;font-weight:700;line-height:1.12;letter-spacing:-.02em}
a{color:var(--terra);text-decoration:none}
header{background:rgba(255,251,244,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);position:sticky;top:0;z-index:10}
.nav{max-width:1100px;margin:0 auto;display:flex;align-items:center;height:66px;padding:0 22px;gap:16px}
.logo{font-family:Poppins;font-weight:800;font-size:1.3rem;color:var(--ink)}.logo span{color:var(--green)}
.nav .sp{margin-left:auto;display:flex;gap:20px;font-family:Poppins;font-weight:600;font-size:.9rem}.nav .sp a{color:var(--ink)}
.btn{display:inline-flex;align-items:center;gap:.5em;font-family:Poppins;font-weight:600;font-size:.93rem;padding:.85em 1.5em;border-radius:999px;border:2px solid var(--green);background:linear-gradient(135deg,#358a5c,var(--green-d));color:#fff;cursor:pointer;box-shadow:0 8px 20px -10px rgba(35,94,61,.5)}
.btn.g{background:linear-gradient(135deg,#358a5c,var(--green-d));border-color:var(--green)}
.btn.wa{background:linear-gradient(135deg,#2bd06f,#1aab53);border-color:#1aab53}
.crumb{font-size:.82rem;color:var(--muted);padding:26px 0 0}.crumb a{color:var(--muted)}
article{padding:14px 0 60px}
h1{font-size:clamp(2rem,5vw,3rem);margin:10px 0 12px}
.lede{font-size:1.15rem;color:var(--muted);margin-bottom:18px}
.rmeta{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.rmeta span{background:#fff;border:1px solid var(--line);border-radius:999px;padding:.4em .9em;font-family:Poppins;font-weight:600;font-size:.82rem}
.rmeta .tm{background:var(--green);color:#fff;border-color:var(--green)}
.hero-img{width:100%;border-radius:22px;aspect-ratio:16/10;object-fit:cover;margin:8px 0 26px;box-shadow:0 24px 50px -28px rgba(80,50,20,.5)}
.intro{font-size:1.08rem;margin-bottom:26px}
h2.sec{font-size:1.5rem;margin:30px 0 14px;padding-top:10px}
ul.ing{list-style:none;display:grid;gap:9px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:20px 22px}
ul.ing li{display:flex;gap:11px;align-items:baseline}
ul.ing li .ie{flex:0 0 auto;width:1.5em;text-align:center;font-size:1.1em}
.chefline{display:flex;align-items:center;gap:13px;margin:8px 0 18px}
.chefline .av{width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#358a5c,#235E3D);color:#fff;font-family:Poppins;font-weight:700;font-size:1.1rem;display:grid;place-items:center;flex:0 0 auto;box-shadow:0 8px 18px -8px rgba(35,94,61,.6)}
.chefline .ct{display:flex;flex-direction:column;line-height:1.3}
.chefline .ct b{font-family:Poppins;font-weight:700;font-size:1.08rem;color:var(--ink)}
.chefline .ct span{font-size:.92rem;color:var(--muted)}
ol.steps{list-style:none;counter-reset:s;display:grid;gap:16px;padding:0}
ol.steps li{counter-increment:s;position:relative;padding-left:46px}
ol.steps li::before{content:counter(s);position:absolute;left:0;top:-3px;width:32px;height:32px;border-radius:50%;background:var(--terra);color:#fff;font-family:Poppins;font-weight:700;display:grid;place-items:center}
.tips{background:var(--warm);border-radius:16px;padding:18px 22px;margin:24px 0}
.tips ul{margin:8px 0 0 18px}.tips li{margin:6px 0}
.faq{margin-top:30px}.faq details{background:#fff;border:1px solid var(--line);border-radius:14px;padding:14px 18px;margin-bottom:10px}
.faq summary{font-family:Poppins;font-weight:600;cursor:pointer}.faq p{margin-top:8px;color:var(--muted)}
.cta{background:var(--ink);color:#fff;border-radius:22px;padding:34px;margin:40px 0 0;text-align:center}
.cta h3{color:#fff;font-size:1.5rem;margin-bottom:8px}.cta p{color:rgba(255,255,255,.8);max-width:46ch;margin:0 auto 18px}
.cta .row{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
footer{background:var(--green-d);color:rgba(255,255,255,.75);text-align:center;padding:40px 22px;font-size:.85rem}
footer .logo{color:#fff}footer .logo span{color:var(--amber)}
footer .disc{max-width:70ch;margin:14px auto 0;font-size:.72rem;line-height:1.55;color:rgba(255,255,255,.55)}
.foot-links{display:flex;gap:20px;justify-content:center;flex-wrap:wrap;margin:12px 0 4px;font-family:Poppins;font-weight:600;font-size:.84rem}.foot-links a{color:rgba(255,255,255,.85)}
.disc-box{background:var(--warm);border-radius:12px;padding:13px 16px;margin:26px 0 0;font-size:.8rem;color:var(--muted);line-height:1.5}
.back{display:inline-block;margin-top:26px;font-family:Poppins;font-weight:600}
`;

function recipeJsonLd(r, siteUrl) {
  const url = `${siteUrl}/recipes/${r.slug}.html`;
  const img = `${siteUrl}/assets/${r.image}`;
  return {
    "@context": "https://schema.org/",
    "@type": "Recipe",
    name: r.title,
    image: [img],
    author: { "@type": "Person", name: "Chef Aly", description: "Thermomix consultant" },
    datePublished: r.datePublished,
    description: r.description,
    recipeCuisine: r.cuisine || "International",
    recipeCategory: r.category || "Main",
    keywords: (r.keywords || []).join(", "),
    prepTime: iso(r.prepMin),
    cookTime: iso(r.cookMin),
    totalTime: iso(totalMin(r)),
    recipeYield: `${r.servings} servings`,
    recipeIngredient: r.ingredients,
    recipeInstructions: r.steps.map((t, i) => ({ "@type": "HowToStep", position: i + 1, text: t })),
    publisher: { "@type": "Organization", name: "Chef Aly — Thermomix", url: siteUrl },
    mainEntityOfPage: url,
  };
}
function faqJsonLd(r) {
  if (!r.faq || !r.faq.length) return null;
  return {
    "@context": "https://schema.org/",
    "@type": "FAQPage",
    mainEntity: r.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}
function breadcrumbJsonLd(r, siteUrl) {
  return {
    "@context": "https://schema.org/",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Recipes", item: `${siteUrl}/recipes/` },
      { "@type": "ListItem", position: 3, name: r.title, item: `${siteUrl}/recipes/${r.slug}.html` },
    ],
  };
}

export function renderRecipePage(r, siteUrl) {
  const url = `${siteUrl}/recipes/${r.slug}.html`;
  const img = `${siteUrl}/assets/${r.image}`;
  const ld = [recipeJsonLd(r, siteUrl), faqJsonLd(r), breadcrumbJsonLd(r, siteUrl)].filter(Boolean);
  const ings = r.ingredients.map((i) => `<li><span class="ie">${ingredientEmoji(i)}</span><span>${esc(i)}</span></li>`).join("");
  const insp = r.inspiredBy && r.inspiredBy.chef ? r.inspiredBy : null;
  const steps = r.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  const tips = (r.tips || []).filter(Boolean).map((t) => `<li>${esc(t)}</li>`).join("");
  const faq = (r.faq || []).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-G1D265RTZ0"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-G1D265RTZ0');</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/><link rel="icon" href="/favicon-32.png" sizes="32x32"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<title>${esc(r.title)} (Thermomix Recipe) | ${SITE_NAME}</title>
<meta name="description" content="${esc(r.description)}"/>
<link rel="canonical" href="${url}"/>
<meta property="og:type" content="article"/><meta property="og:title" content="${esc(r.title)} — Thermomix Recipe"/>
<meta property="og:description" content="${esc(r.description)}"/><meta property="og:image" content="${img}"/><meta property="og:url" content="${url}"/>
<meta name="twitter:card" content="summary_large_image"/><meta name="twitter:title" content="${esc(r.title)} — Thermomix Recipe"/>
<meta name="twitter:description" content="${esc(r.description)}"/><meta name="twitter:image" content="${img}"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>${HEAD_CSS}</style>
${ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
</head><body>
<header><div class="nav"><a class="logo" href="../index.html">Thermie<span>Chef</span></a><div class="sp"><a href="../index.html#recipes">Recipes</a><a href="./">All recipes</a><a href="../index.html#thermomix">Thermomix</a><a href="${BUY_URL}" target="_blank" rel="noopener" onclick="trackBuy('recipe-nav')">Get a Thermomix</a></div></div></header>
<div class="wrap">
  <nav class="crumb"><a href="../index.html">Home</a> › <a href="./">Recipes</a> › ${esc(r.title)}</nav>
  <article>
    <h1>${esc(r.title)}</h1>
    ${insp ? `<div class="chefline"><span class="av">${chefInitials(insp.chef)}</span><div class="ct"><b>Inspired by ${esc(insp.chef)}</b><span>My Thermomix reimagining of their ${esc(insp.dish || "classic")}</span></div></div>` : ""}
    <p class="lede">${esc(r.description)}</p>
    <div class="rmeta"><span class="tm">${esc(r.thermomixModel || "TM6 / TM7")}</span><span>⏱️ Prep ${r.prepMin} min</span><span>🍳 Cook ${r.cookMin} min</span><span>🍽️ Serves ${r.servings}</span><span>📊 ${esc(r.category || "Main")}</span></div>
    <img class="hero-img" src="../assets/${esc(r.image)}" alt="${esc(r.title)} made in a Thermomix" width="820" height="512"/>
    <p class="intro">${esc(r.intro)}</p>
    <h2 class="sec">Ingredients</h2>
    <ul class="ing">${ings}</ul>
    <h2 class="sec">Thermomix method</h2>
    <ol class="steps">${steps}</ol>
    ${tips ? `<div class="tips"><h3>Aly's tips</h3><ul>${tips}</ul></div>` : ""}
    ${faq ? `<section class="faq"><h2 class="sec">Questions</h2>${faq}</section>` : ""}
    <div class="cta">
      <h3>Want to cook this in minutes?</h3>
      <p>Every recipe here is made for the Thermomix. Get yours through me, or message me and I'll help you choose.</p>
      <div class="row"><a class="btn" href="${BUY_URL}" target="_blank" rel="noopener" onclick="trackBuy('recipe')">Get your Thermomix →</a><a class="btn wa" href="${ALY_WA}" target="_blank" rel="noopener" onclick="track('whatsapp','recipe')">Chat with Aly</a></div>
    </div>
    <div class="disc-box">${insp ? `An independent Thermomix reinterpretation inspired by ${esc(insp.chef)}'s ${esc(insp.dish || "dish")}. Not affiliated with, authorised by or endorsed by ${esc(insp.chef)} or any publisher; the method here is Chef Aly's own. ` : "Recipe developed for the Thermomix by Chef Aly. "}Speeds, times and temperatures are a guide — always check your own Thermomix model's manual and use your judgement, especially around hot liquids and food safety. This is independent content and is not official Thermomix content.</div>
    <a class="back" href="./">← All recipes</a>
  </article>
</div>
<footer><div class="logo">Thermie<span>Chef</span></div><p style="margin-top:6px">Famous recipes, reimagined for your Thermomix.</p><nav class="foot-links"><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a><a href="/index.html">Home</a></nav><p class="disc">Aly is an Independent Thermomix Consultant. This is a personal consultant website and is not an official Vorwerk / Thermomix website. Thermomix, Varoma and Cookidoo are trademarks of Vorwerk. All purchases are completed on the official Thermomix store.</p></footer>
<script>${TRACK_JS}</script>
</body></html>`;
}

export function renderIndexPage(recipes, siteUrl) {
  const chefsList = [...new Set(recipes.map((r) => r.inspiredBy && r.inspiredBy.chef).filter(Boolean))].sort();
  const catList = [...new Set(recipes.map((r) => r.category).filter(Boolean))];
  const cards = recipes.map((r) => { const chef = (r.inspiredBy && r.inspiredBy.chef) || ""; return `<a class="card" data-cat="${esc((r.category || "").toLowerCase())}" data-chef="${esc(chef)}" data-s="${esc((r.title + " " + chef + " " + (r.cuisine || "") + " " + (r.category || "")).toLowerCase())}" href="${r.slug}.html"><div class="ph"><img src="../assets/${esc(r.image)}" alt="${esc(r.title)}" loading="lazy"/>${chef ? `<span class="chef"><span class="av">${chefInitials(chef)}</span><span class="nm">${esc(chef)}</span></span>` : ""}</div><div class="cb"><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><span class="m">⏱️ ${totalMin(r)} min · Serves ${r.servings}</span></div></a>`; }).join("");
  const filterBar = `<div class="filters">
    <input id="rsearch" class="rsearch" placeholder="Search recipes or chefs…" oninput="filt()" aria-label="Search recipes"/>
    <select id="rchef" class="rchef" onchange="filt()"><option value="">All chefs</option>${chefsList.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("")}</select>
  </div>
  <div class="chips"><button class="chip on" data-cat="" onclick="setCat(this)">All</button>${catList.map((c) => `<button class="chip" data-cat="${esc(c.toLowerCase())}" onclick="setCat(this)">${esc(c)}</button>`).join("")}</div>
  <p class="rcount"><span id="rcount">${recipes.length}</span> recipes</p>
  <script>
  var curCat="";
  function setCat(b){curCat=b.getAttribute('data-cat')||"";var cs=document.querySelectorAll('.chip');for(var i=0;i<cs.length;i++)cs[i].classList.toggle('on',cs[i]===b);filt();}
  function filt(){var q=(document.getElementById('rsearch').value||'').toLowerCase().trim();var chef=document.getElementById('rchef').value||'';var cards=document.querySelectorAll('.rgrid .card'),n=0;for(var i=0;i<cards.length;i++){var c=cards[i];var ok=(!curCat||c.getAttribute('data-cat')===curCat)&&(!chef||c.getAttribute('data-chef')===chef)&&(!q||(c.getAttribute('data-s')||'').indexOf(q)>=0);c.classList.toggle('hide',!ok);if(ok)n++;}document.getElementById('rcount').textContent=n;document.getElementById('noRes').style.display=n?'none':'block';}
  </script>`;
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<script async src="https://www.googletagmanager.com/gtag/js?id=G-G1D265RTZ0"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-G1D265RTZ0');</script>
<link rel="icon" href="/favicon.svg" type="image/svg+xml"/><link rel="icon" href="/favicon-32.png" sizes="32x32"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<title>Thermomix Recipes | ${SITE_NAME}</title>
<meta name="description" content="Easy, reliable Thermomix recipes from Chef Aly — a new recipe every day, with exact speeds, times and temperatures for the TM6 and TM7."/>
<link rel="canonical" href="${siteUrl}/recipes/"/>
<meta property="og:title" content="Thermomix Recipes — Chef Aly"/><meta property="og:description" content="A new Thermomix recipe every day."/><meta property="og:image" content="${siteUrl}/assets/hero-table.jpg"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>${HEAD_CSS}
.wrap{max-width:1100px}
.head{padding:36px 0 8px}.head h1{font-size:clamp(2rem,5vw,3rem)}.head p{color:var(--muted);font-size:1.1rem;margin-top:8px;max-width:54ch}
.rgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:24px 0 60px}
.card{background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px -18px rgba(80,50,20,.4);display:block}
.card .ph{position:relative;aspect-ratio:4/3;overflow:hidden}.card .ph img{width:100%;height:100%;object-fit:cover}
.card .chef{position:absolute;left:10px;bottom:10px;z-index:2;display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.96);border-radius:999px;padding:4px 12px 4px 4px;box-shadow:0 6px 16px -6px rgba(0,0,0,.45)}
.card .chef .av{width:27px;height:27px;border-radius:50%;background:linear-gradient(135deg,#358a5c,#235E3D);color:#fff;font-family:Poppins;font-weight:700;font-size:.7rem;display:grid;place-items:center;flex:0 0 auto}
.card .chef .nm{font-family:Poppins;font-weight:700;font-size:.76rem;color:var(--ink)}
.card .cb{padding:16px 18px 20px}.card h3{font-size:1.18rem;color:var(--ink);margin-bottom:6px}.card p{color:var(--muted);font-size:.9rem;margin-bottom:10px}
.card .m{font-family:Poppins;font-weight:600;font-size:.82rem;color:var(--terra)}
@media(max-width:820px){.rgrid{grid-template-columns:1fr 1fr}}@media(max-width:540px){.rgrid{grid-template-columns:1fr}}
.filters{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:6px 0 14px}
.rsearch{flex:1;min-width:200px;padding:.72em 1.1em;border:1.5px solid var(--line);border-radius:999px;font-size:.95rem;font-family:inherit;background:#fff}
.rsearch:focus{outline:none;border-color:var(--terra)}
.rchef{padding:.62em 1.1em;border:1.5px solid var(--line);border-radius:999px;font-family:Poppins;font-weight:600;font-size:.85rem;background:#fff;color:var(--ink)}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px}
.chip{background:#fff;border:1px solid var(--line);border-radius:999px;padding:.5em 1.05em;font-family:Poppins;font-weight:600;font-size:.84rem;cursor:pointer;transition:.15s}
.chip.on{background:var(--green);color:#fff;border-color:var(--green)}
.rcount{color:var(--muted);font-size:.85rem;font-family:Poppins;font-weight:600;margin:4px 0 0}
.rgrid .card.hide{display:none}
.no-res{display:none;color:var(--muted);padding:40px 0;text-align:center;font-size:1.05rem}
</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org/", "@type": "CollectionPage", name: "Thermomix Recipes", url: `${siteUrl}/recipes/`, hasPart: recipes.map((r) => ({ "@type": "Recipe", name: r.title, url: `${siteUrl}/recipes/${r.slug}.html` })) })}</script>
</head><body>
<header><div class="nav"><a class="logo" href="../index.html">Thermie<span>Chef</span></a><div class="sp"><a href="../index.html#recipes">Latest</a><a href="../index.html#thermomix">Thermomix</a><a href="${BUY_URL}" target="_blank" rel="noopener" onclick="trackBuy('recipes-index')">Get yours</a></div></div></header>
<div class="wrap">
  <div class="head"><h1>Famous recipes, reimagined for Thermomix</h1><p>Iconic dishes from the world's best chefs, rebuilt for your TM6 and TM7 — exact speeds, times and temperatures. A new one every day.</p></div>
  ${filterBar}
  <div class="rgrid">${cards}</div>
  <p class="no-res" id="noRes">No recipes match — try clearing the filters.</p>
</div>
<footer><div class="logo">Thermie<span>Chef</span></div><p style="margin-top:6px">Famous recipes, reimagined for your Thermomix.</p><nav class="foot-links"><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a><a href="/index.html">Home</a></nav></footer>
<script>${TRACK_JS}</script>
</body></html>`;
}

export function homepageCards(recipes) {
  return recipes.map((r) => { const chef = (r.inspiredBy && r.inspiredBy.chef) || ""; return `      <a class="card" href="recipes/${r.slug}.html"><div class="ph"><img src="assets/${esc(r.image)}" alt="${esc(r.title)}" loading="lazy"/>${chef ? `<span class="chef"><span class="av">${chefInitials(chef)}</span><span class="nm">${esc(chef)}</span></span>` : ""}</div><div class="cb"><h3>${esc(r.title)}</h3><div class="meta"><span>⏱️ ${totalMin(r)} min</span><span>🍽️ Serves ${r.servings}</span></div></div></a>`; }).join("\n");
}
