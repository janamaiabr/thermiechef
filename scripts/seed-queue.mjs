// Pre-written recipe QUEUE (keyless auto-publish). Each recipe has a FUTURE
// datePublished; build.mjs only publishes once the date arrives, so the daily
// cron releases one per day automatically. Skips slugs that already exist.
// Run: node scripts/seed-queue.mjs
import { writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "recipes", "data");

// dates start tomorrow (today is 2026-06-20), one per day
const START = new Date("2026-06-21T00:00:00Z");
const dateFor = (i) => { const d = new Date(START); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); };

const Q = [
{ slug:"focaccia-paul-hollywood", title:"Rosemary Focaccia", inspiredBy:{chef:"Paul Hollywood",dish:"focaccia"}, image:"food-bread.jpg", category:"Baking", cuisine:"Italian", prepMin:15, cookMin:25, servings:8,
  keywords:["thermomix focaccia","paul hollywood focaccia thermomix","TM6 bread dough"], thermomixModel:"TM6 / TM7",
  intro:"Paul Hollywood made the nation fall for proper bread. The Thermomix mixes and kneads this dimpled, olive-oil-rich focaccia for you — all you do is dimple and bake.",
  ingredients:["350 g warm water","7 g dried yeast","1 tsp sugar","500 g baker's flour","1.5 tsp salt","40 g olive oil, plus extra","Rosemary and flaky salt, to top"],
  steps:["Place water, yeast and sugar in the bowl. Warm 2 min / 37°C / speed 2 until foamy.","Add the flour, salt and olive oil. Mix 6 sec / speed 6.","Knead 3 min / dough mode.","Tip into an oiled tray, cover and prove 1 hour until puffy. Dimple all over with oiled fingers, drizzle with oil, scatter rosemary and flaky salt.","Bake in a preheated oven at 220°C for 22–25 minutes until golden. (The Thermomix makes the dough; baking is done in your oven.)"],
  tips:["Don't skimp on the olive oil — it's what makes focaccia.","Press your dimples deep so they hold little pools of oil."],
  faq:[{q:"Can the Thermomix knead focaccia dough?",a:"Yes — dough mode kneads this wet dough in 3 minutes; you only shape and bake."}] },

{ slug:"chocolate-mousse-delia-smith", title:"Chocolate Mousse", inspiredBy:{chef:"Delia Smith",dish:"chocolate mousse"}, image:"dish-dessert.jpg", category:"Dessert", cuisine:"French", prepMin:15, cookMin:5, servings:6,
  keywords:["thermomix chocolate mousse","delia smith mousse thermomix","easy chocolate mousse TM6"], thermomixModel:"TM6 / TM7",
  intro:"Delia Smith taught Britain to cook, and her chocolate mousse is pure, dark and grown-up. The Thermomix melts the chocolate and whips the eggs, so it comes together in minutes.",
  ingredients:["200 g dark chocolate, broken","4 eggs, separated","40 g caster sugar","1 pinch salt"],
  steps:["Place the chocolate in the bowl and chop 8 sec / speed 8. Melt 4 min / 50°C / speed 2, then tip into a bowl.","Insert the butterfly. Add the egg whites and salt and whip 3 min / speed 4 to firm peaks; set aside.","Without washing, add the yolks and sugar and mix 30 sec / speed 4. Add the melted chocolate and mix 10 sec / speed 3.","Fold the whipped whites through by hand, gently. Spoon into glasses and chill 2 hours."],
  tips:["Fold — don't stir — the whites in to keep it airy.","Use a good 70% dark chocolate for that grown-up edge."],
  faq:[{q:"Why separate the eggs?",a:"Whipped whites give the mousse its light, airy set without any cream."}] },

{ slug:"carrot-coriander-soup-nigel-slater", title:"Carrot & Coriander Soup", inspiredBy:{chef:"Nigel Slater",dish:"carrot & coriander soup"}, image:"food-soup.jpg", category:"Lunch", cuisine:"British", prepMin:10, cookMin:25, servings:4,
  keywords:["thermomix carrot soup","nigel slater carrot coriander soup thermomix","TM6 soup"], thermomixModel:"TM6 / TM7",
  intro:"Nigel Slater writes about food like it's poetry, and his carrot and coriander soup is comfort in a bowl. The Thermomix cooks and blends it velvety in the same bowl.",
  ingredients:["1 onion, halved","2 garlic cloves","20 g ginger","20 g olive oil","600 g carrots, chopped","700 g vegetable stock","1 tsp ground coriander","Fresh coriander, to finish","Salt and pepper"],
  steps:["Chop onion, garlic and ginger 4 sec / speed 5. Scrape down.","Add oil and ground coriander and sauté 3 min / 120°C / speed 1.","Add carrots and stock. Cook 20 min / 100°C / speed 1.","Blend 1 min / speed 4 to speed 9 until silky. Season and finish with fresh coriander."],
  tips:["A squeeze of orange juice at the end lifts the carrots beautifully.","Add a swirl of yoghurt or coconut milk for richness."],
  faq:[{q:"Can I make this dairy-free?",a:"Yes — it's naturally dairy-free; finish with coconut milk instead of yoghurt."}] },

{ slug:"spiced-lamb-aubergine-sabrina-ghayour", title:"Spiced Lamb & Aubergine", inspiredBy:{chef:"Sabrina Ghayour",dish:"spiced lamb & aubergine"}, image:"dish-chicken.jpg", category:"Dinner", cuisine:"Persian", prepMin:15, cookMin:35, servings:4,
  keywords:["thermomix lamb aubergine","sabrina ghayour thermomix","persian lamb stew TM6"], thermomixModel:"TM6 / TM7",
  intro:"Sabrina Ghayour brought Persian flavours to everyone's table. This rich, spiced lamb and aubergine is fragrant with cinnamon and cumin — the Thermomix simmers it tender.",
  ingredients:["1 onion, halved","3 garlic cloves","30 g olive oil","500 g lamb, diced","1 aubergine, cubed","1 tsp cumin","1 tsp cinnamon","2 tbsp tomato paste","400 g chopped tomatoes","200 g stock","Salt, pepper, parsley"],
  steps:["Chop onion and garlic 4 sec / speed 5. Scrape.","Add oil and spices and sauté 3 min / 120°C / speed 1.","Add lamb and sear 5 min / 120°C / Reverse / speed 1.","Add aubergine, tomato paste, tomatoes and stock. Cook 30 min / 100°C / Reverse / speed 1, MC off and basket on the lid. Season and scatter with parsley."],
  tips:["Cinnamon with lamb is the Persian signature — don't skip it.","Lovely over rice or with warm flatbread."],
  faq:[{q:"Can I use beef instead of lamb?",a:"Yes — beef chuck works well; keep the slow simmer so it goes tender."}] },

{ slug:"coconut-greens-dal-anna-jones", title:"Coconut Greens Dal", inspiredBy:{chef:"Anna Jones",dish:"coconut dal"}, image:"dish-bowl.jpg", category:"Dinner", cuisine:"Indian", prepMin:10, cookMin:30, servings:4,
  keywords:["thermomix coconut dal","anna jones dal thermomix","vegan dal TM6"], thermomixModel:"TM6 / TM7",
  intro:"Anna Jones makes vegetables the star. This creamy coconut dal with greens is her kind of food — nourishing and easy. The Thermomix cooks the lentils hands-free.",
  ingredients:["1 onion, halved","3 garlic cloves","20 g ginger","20 g coconut oil","1 tsp turmeric","1 tsp cumin","250 g red lentils, rinsed","400 g coconut milk","400 g water","100 g spinach","Salt, lime"],
  steps:["Chop onion, garlic and ginger 4 sec / speed 5. Scrape.","Add coconut oil, turmeric and cumin and sauté 3 min / 120°C / speed 1.","Add lentils, coconut milk and water. Cook 22 min / 100°C / speed 1, basket on the lid.","Add the spinach and cook 3 min / 100°C / Reverse / speed 1. Finish with salt and lime."],
  tips:["Stir in a handful of spinach right at the end so it stays green.","Top with toasted coconut and chilli for crunch."],
  faq:[{q:"Is it vegan?",a:"Yes — completely plant-based and gluten-free."}] },

{ slug:"mac-and-cheese-curtis-stone", title:"Creamy Mac & Cheese", inspiredBy:{chef:"Curtis Stone",dish:"mac and cheese"}, image:"dish-pasta.jpg", category:"Dinner", cuisine:"American", prepMin:10, cookMin:20, servings:4,
  keywords:["thermomix mac and cheese","curtis stone mac cheese thermomix","cheese sauce TM6"], thermomixModel:"TM6 / TM7",
  intro:"Curtis Stone does comfort food beautifully. The Thermomix makes a lump-free cheese sauce in minutes — stir through cooked pasta and you've got the creamiest mac and cheese.",
  ingredients:["250 g cheddar, cubed","40 g butter","40 g plain flour","600 g milk","1 tsp mustard","1 pinch nutmeg","Salt and pepper","300 g macaroni, cooked"],
  steps:["Grate the cheddar 8 sec / speed 8; set aside.","Add butter, flour and milk. Cook 8 min / 90°C / speed 4 until thickened to a smooth white sauce.","Add the cheese, mustard and nutmeg. Mix 20 sec / speed 4 until melted and glossy. Season.","Stir the cooked macaroni through the sauce. For a crust, top with breadcrumbs and grill a few minutes."],
  tips:["Grating the cheese in the Thermomix means it melts smooth, never grainy.","A spoon of mustard sharpens the whole thing."],
  faq:[{q:"Why won't the cheese sauce go lumpy?",a:"Cooking the flour, butter and milk together at speed 4 keeps it constantly whisked and silky."}] },

{ slug:"steamed-ginger-soy-fish-kylie-kwong", title:"Steamed Ginger & Soy Fish", inspiredBy:{chef:"Kylie Kwong",dish:"steamed fish"}, image:"hero-table.jpg", category:"Dinner", cuisine:"Chinese", prepMin:10, cookMin:20, servings:4,
  keywords:["thermomix steamed fish","kylie kwong fish thermomix","varoma fish TM7"], thermomixModel:"TM6 / TM7",
  intro:"Kylie Kwong's steamed fish is elegant and light. The Thermomix steams the fish gently in the Varoma while the rice cooks below — a whole dinner in one go.",
  ingredients:["4 white fish fillets","20 g ginger, julienned","3 spring onions, sliced","30 g soy sauce","15 g sesame oil","For the rice: 300 g jasmine rice, rinsed + 360 g water"],
  steps:["Rinse the rice and place with the water in the mixing bowl.","Lay the fish in the Varoma dish, scatter with half the ginger. Set the Varoma in position.","Cook 18 min / Varoma / speed 2 — the rice cooks below while the fish steams above.","Top the fish with the remaining ginger and spring onions, pour over warmed soy and sesame oil, and serve over the rice."],
  tips:["Steaming keeps the fish silky and delicate — don't overcook it.","Heat the soy and sesame oil until just smoking and pour over to sizzle."],
  faq:[{q:"Which fish works best?",a:"A firm white fish like snapper, barramundi or ling holds together when steamed."}] },

{ slug:"apple-teacake-stephanie-alexander", title:"Apple Teacake", inspiredBy:{chef:"Stephanie Alexander",dish:"apple teacake"}, image:"food-cake.jpg", category:"Baking", cuisine:"Australian", prepMin:15, cookMin:40, servings:8,
  keywords:["thermomix apple teacake","stephanie alexander teacake thermomix","apple cake TM6"], thermomixModel:"TM6 / TM7",
  intro:"Stephanie Alexander is an Australian treasure. Her apple teacake is the kind of simple, buttery cake that fills the house with cinnamon. The Thermomix makes the batter in one bowl.",
  ingredients:["125 g butter, soft","150 g caster sugar","2 eggs","225 g self-raising flour","100 g milk","1 tsp vanilla","1 apple, thinly sliced","Butter, cinnamon and sugar, to top"],
  steps:["Add butter, sugar, eggs, flour, milk and vanilla. Mix 25 sec / speed 5, scrape, then 10 sec / speed 4.","Spoon into a lined round tin and smooth the top.","Arrange the apple slices over the top, brush with melted butter and dust with cinnamon sugar.","Bake in a preheated oven at 180°C for 35–40 minutes until golden and springy."],
  tips:["Fan the apple slices over the top for that classic teacake look.","Best warm, with a cup of tea — as intended."],
  faq:[{q:"No self-raising flour?",a:"Use plain flour with 2 tsp baking powder."}] },

{ slug:"lentil-mushroom-ragu-tom-kerridge", title:"Lentil & Mushroom Ragù", inspiredBy:{chef:"Tom Kerridge",dish:"lentil ragù"}, image:"food-risotto.jpg", category:"Dinner", cuisine:"Italian", prepMin:12, cookMin:30, servings:4,
  keywords:["thermomix lentil ragu","tom kerridge lentil mushroom thermomix","vegetarian ragu TM6"], thermomixModel:"TM6 / TM7",
  intro:"Tom Kerridge proves lighter food can be deeply satisfying. This meat-free lentil and mushroom ragù is rich and hearty — the Thermomix builds it all in one bowl.",
  ingredients:["1 onion, halved","2 garlic cloves","1 carrot","250 g mushrooms","30 g olive oil","150 g dried green lentils","2 tbsp tomato paste","700 g passata","100 g red wine","1 tsp dried oregano","Salt, pepper, parmesan"],
  steps:["Chop onion, garlic, carrot and mushrooms 5 sec / speed 5. Scrape.","Add oil and sauté 4 min / 120°C / speed 1.","Add lentils, tomato paste, passata, wine and oregano. Cook 28 min / 100°C / Reverse / speed 1, MC off and basket on the lid, until the lentils are tender. Season and serve over pasta with parmesan."],
  tips:["Chopping the mushrooms fine gives the ragù a meaty texture.","Even better the next day — make a double batch."],
  faq:[{q:"Do the lentils need soaking?",a:"No — green lentils cook from dry in the sauce in about 28 minutes."}] },

{ slug:"parmesan-risotto-massimo-bottura", title:"Parmesan Risotto", inspiredBy:{chef:"Massimo Bottura",dish:"parmesan risotto"}, image:"food-risotto.jpg", category:"Dinner", cuisine:"Italian", prepMin:10, cookMin:20, servings:4,
  keywords:["thermomix parmesan risotto","massimo bottura risotto thermomix","cheese risotto TM6"], thermomixModel:"TM6 / TM7",
  intro:"Massimo Bottura turned risotto into art. This stripped-back parmesan risotto celebrates the cheese — and the Thermomix gets it creamy with no stirring at all.",
  ingredients:["1 onion, halved","30 g butter","320 g arborio rice","100 g white wine","800 g hot vegetable stock","80 g parmesan, grated","20 g extra butter","Salt and pepper"],
  steps:["Chop onion 4 sec / speed 5. Add butter and sauté 3 min / 120°C / speed 1.","Add rice and wine and cook 2 min / 100°C / Reverse / speed 1.","Add the hot stock. Cook 16 min / 100°C / Reverse / speed 1, MC off and basket on the lid.","Add parmesan and extra butter. Stir 20 sec / Reverse / speed 1. Rest 2 minutes — it should be loose and glossy. Season."],
  tips:["Bottura's secret is finishing hard with cheese and butter for a glossy 'mantecatura'.","Keep it loose — risotto should ripple, not stand up."],
  faq:[{q:"Why use arborio rice?",a:"Its high starch is what makes risotto creamy without any cream."}] },

{ slug:"salted-caramel-sauce-diana-henry", title:"Salted Caramel Sauce", inspiredBy:{chef:"Diana Henry",dish:"salted caramel"}, image:"dish-smoothie.jpg", category:"Dessert", cuisine:"International", prepMin:5, cookMin:12, servings:10,
  keywords:["thermomix salted caramel","diana henry caramel thermomix","caramel sauce TM6"], thermomixModel:"TM6 / TM7",
  intro:"Diana Henry writes some of the most beautiful food books around. This salted caramel is glossy and deep — and the Thermomix makes it without the fear of a burnt pan.",
  ingredients:["200 g caster sugar","60 g water","100 g butter, cubed","150 g thickened cream","1 tsp flaky salt"],
  steps:["Place the sugar and water in the bowl. Cook 9 min / Varoma / speed 1, MC off, until deep amber.","Add the butter and cook 2 min / 100°C / speed 2 (take care, it will bubble up).","Add the cream and salt and mix 30 sec / 80°C / speed 3 until smooth and glossy. Cool — it thickens as it sits."],
  tips:["Watch the colour at the end — amber is flavour, but too dark turns bitter.","Keeps 2 weeks in the fridge; warm gently to pour."],
  faq:[{q:"Is it hard to make caramel in a Thermomix?",a:"No — it cooks at a steady temperature with no stirring, so there's far less risk of burning."}] },

{ slug:"ginger-scallion-noodles-david-chang", title:"Ginger Scallion Noodles", inspiredBy:{chef:"David Chang",dish:"ginger scallion noodles"}, image:"dish-pasta.jpg", category:"Dinner", cuisine:"Korean-American", prepMin:10, cookMin:5, servings:4,
  keywords:["thermomix ginger scallion noodles","david chang noodles thermomix","momofuku noodles TM6"], thermomixModel:"TM6 / TM7",
  intro:"David Chang's ginger scallion sauce is legendary. The Thermomix chops it into a punchy, glossy sauce in seconds — toss through hot noodles and dinner's done.",
  ingredients:["6 spring onions","40 g ginger","60 g neutral oil","20 g soy sauce","15 g rice vinegar","1 tsp sesame oil","1 tsp sugar","400 g cooked noodles"],
  steps:["Place the spring onions and ginger in the bowl and chop 4 sec / speed 5. Scrape down.","Add the oil and warm 3 min / 70°C / speed 1 to mellow the raw bite.","Add the soy, vinegar, sesame oil and sugar and mix 5 sec / speed 3.","Toss the warm sauce through hot cooked noodles and serve straight away."],
  tips:["Gently warming the sauce takes the raw edge off the ginger and onion.","Brilliant over rice, greens or chicken too."],
  faq:[{q:"Can I make the sauce ahead?",a:"Yes — it keeps a few days in the fridge and gets better as it sits."}] },

{ slug:"pea-ham-soup-marco-pierre-white", title:"Pea & Ham Soup", inspiredBy:{chef:"Marco Pierre White",dish:"pea & ham soup"}, image:"dish-soup.jpg", category:"Lunch", cuisine:"British", prepMin:10, cookMin:25, servings:4,
  keywords:["thermomix pea and ham soup","marco pierre white soup thermomix","pea soup TM6"], thermomixModel:"TM6 / TM7",
  intro:"Marco Pierre White is all about big flavour from simple things. This pea and ham soup is comfort itself — the Thermomix cooks and blends it smooth in one bowl.",
  ingredients:["1 onion, halved","20 g butter","500 g frozen peas","150 g cooked ham, diced","700 g chicken stock","1 sprig mint","Salt and pepper","Cream, to finish"],
  steps:["Chop onion 4 sec / speed 5. Add butter and sauté 3 min / 120°C / speed 1.","Add the peas, half the ham, stock and mint. Cook 15 min / 100°C / speed 1.","Blend 1 min / speed 4 to speed 8 until smooth. Stir the rest of the ham through, season and finish with a swirl of cream."],
  tips:["Keep a little ham back to stir through at the end for texture.","A pinch of mint keeps the peas tasting fresh and sweet."],
  faq:[{q:"Can I use a ham hock?",a:"Yes — simmer a hock in the stock first for deeper flavour, then shred the meat in."}] },

{ slug:"ginger-chicken-congee-neil-perry", title:"Ginger Chicken Congee", inspiredBy:{chef:"Neil Perry",dish:"chicken congee"}, image:"food-soup.jpg", category:"Breakfast", cuisine:"Chinese", prepMin:10, cookMin:45, servings:4,
  keywords:["thermomix congee","neil perry congee thermomix","chicken rice porridge TM6"], thermomixModel:"TM6 / TM7",
  intro:"Neil Perry champions gentle, soulful Asian cooking. Congee is the ultimate comfort breakfast, and the Thermomix simmers the rice down to silk while you get on with your morning.",
  ingredients:["200 g jasmine rice, rinsed","20 g ginger, sliced","1200 g chicken stock","300 g chicken thigh","Soy, sesame oil, spring onion and coriander, to serve"],
  steps:["Place the rice, ginger and stock in the bowl. Cook 40 min / 100°C / Reverse / speed 1, MC off, until the rice breaks down to a porridge.","Add the chicken thigh and cook 12 min / 100°C / Reverse / speed 1.","Shred the chicken, stir back through and season. Serve topped with soy, sesame oil, spring onion and coriander."],
  tips:["The longer and slower it cooks, the silkier the congee.","Top with anything you love — chilli oil, a soft egg, fried shallots."],
  faq:[{q:"Why cook it so long?",a:"Time is what breaks the rice down into that signature creamy, soothing porridge."}] },
];

let written = 0, skipped = 0;
Q.forEach((r, i) => {
  r.datePublished = dateFor(i);
  const f = join(DATA, `${r.slug}.json`);
  if (existsSync(f)) { skipped++; return; }
  writeFileSync(f, JSON.stringify(r, null, 2) + "\n");
  written++;
});
console.log(`Queue: ${written} written (dates ${dateFor(0)} → ${dateFor(Q.length - 1)}), ${skipped} skipped.`);
