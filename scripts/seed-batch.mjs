// One-off: writes a batch of famous-chef "releitura" recipes to recipes/data/.
// Skips any slug that already exists. Run: node scripts/seed-batch.mjs
import { writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "recipes", "data");

const R = [
{ slug:"creamy-scrambled-eggs-gordon-ramsay", title:"Creamy Scrambled Eggs", inspiredBy:{chef:"Gordon Ramsay",dish:"scrambled eggs"},
  description:"My Thermomix take on Gordon Ramsay's famously soft, creamy scrambled eggs.", image:"food-bread.jpg", category:"Breakfast", cuisine:"British",
  prepMin:3, cookMin:7, servings:2, keywords:["thermomix scrambled eggs","gordon ramsay eggs thermomix","creamy eggs TM6"], datePublished:"2026-06-13", thermomixModel:"TM6 / TM7",
  intro:"Ramsay's trick is low heat and pulling the eggs while they're still glossy. The Thermomix's gentle 90°C and butterfly whisk make them silky every time.",
  ingredients:["6 eggs","30 g butter","1 tbsp crème fraîche","1 pinch salt","Black pepper","Chives, to serve","Sourdough, to serve"],
  steps:["Insert the butterfly whisk. Add the eggs and butter to the mixing bowl. Cook 7 min / 90°C / speed 2, watching closely — stop the moment they're softly set and still glossy.","Add the crème fraîche, salt and pepper. Mix 15 sec / speed 2 — this stops the cooking and keeps them silky.","Serve straight away on hot sourdough, scattered with chives."],
  tips:["Pull them while slightly loose — the residual heat finishes them.","The low 90°C is the secret to creamy, never rubbery, eggs."],
  faq:[{q:"Why cook eggs at only 90°C?",a:"Gentle heat keeps the curds soft and creamy instead of dry and rubbery."},{q:"Do I need the butterfly?",a:"Yes — it folds the eggs slowly so they stay silky."}] },

{ slug:"beef-bourguignon-julia-child", title:"Beef Bourguignon", inspiredBy:{chef:"Julia Child",dish:"beef bourguignon"},
  description:"My Thermomix version of Julia Child's beef bourguignon — a rich red-wine beef stew, low and slow in one bowl.", image:"dish-chicken.jpg", category:"Dinner", cuisine:"French",
  prepMin:20, cookMin:70, servings:5, keywords:["thermomix beef bourguignon","julia child stew thermomix","red wine beef TM6"], datePublished:"2026-06-12", thermomixModel:"TM6 / TM7",
  intro:"Julia made this French classic the dish everyone wants to master. The Thermomix simmers it low and slow on Reverse so the beef goes meltingly tender — no babysitting the pot.",
  ingredients:["1 brown onion, halved","2 garlic cloves","150 g bacon lardons","30 g olive oil","800 g beef chuck, cubed","30 g plain flour","300 g red wine","300 g beef stock","1 tbsp tomato paste","1 bay leaf","2 sprigs thyme","200 g mushrooms","200 g baby onions","Salt and pepper"],
  steps:["Place onion and garlic in the mixing bowl and chop 4 sec / speed 5. Scrape down.","Add the olive oil and bacon and sauté 4 min / 120°C / speed 1.","Add the beef and cook 5 min / 120°C / Reverse / speed 1 to seal.","Add the flour and cook 1 min / 100°C / Reverse / speed 1 to coat.","Add the wine, stock, tomato paste, bay and thyme. Cook 60 min / 100°C / Reverse / speed 1, MC off and basket on the lid, adding the mushrooms and baby onions for the last 20 minutes.","Season and rest. Serve with mash or crusty bread."],
  tips:["For deeper flavour, brown the beef in a hot pan first if you have time.","Even better the next day."],
  faq:[{q:"Can the Thermomix make beef bourguignon?",a:"Yes — it sautés, seals and simmers low-and-slow on Reverse so the beef turns tender without stirring."},{q:"Best cut of beef?",a:"Chuck — its connective tissue melts during the slow cook."}] },

{ slug:"gazpacho-jose-andres", title:"Gazpacho", inspiredBy:{chef:"José Andrés",dish:"gazpacho"},
  description:"My Thermomix take on José Andrés' silky Spanish gazpacho — a cold soup blitzed in seconds.", image:"dish-soup.jpg", category:"Lunch", cuisine:"Spanish",
  prepMin:10, cookMin:0, servings:4, keywords:["thermomix gazpacho","jose andres gazpacho thermomix","cold tomato soup TM6"], datePublished:"2026-06-11", thermomixModel:"TM6 / TM7",
  intro:"No cooking at all — just ripe summer veg blitzed until glassy and smooth. The Thermomix turns a handful of tomatoes into the silkiest cold soup.",
  ingredients:["700 g ripe tomatoes","1 cucumber, peeled","1 red capsicum, deseeded","1 garlic clove","30 g sherry vinegar","40 g stale bread","1 tsp salt","80 g olive oil"],
  steps:["Place the tomatoes, cucumber, capsicum, garlic, vinegar, bread and salt in the mixing bowl. Blend 30 sec / speed 7.","With the blades running on speed 5, drizzle the olive oil through the lid, then blend 1 min / speed 9 until completely silky.","Chill at least 1 hour. Check the seasoning and serve cold with an extra drizzle of olive oil."],
  tips:["The best tomatoes you can find make the whole dish.","For an ultra-smooth finish, pass it through a sieve."],
  faq:[{q:"Do you cook gazpacho?",a:"No — it's a raw, cold soup. The Thermomix just blends it silky."},{q:"Why add bread?",a:"It gives the soup body and that classic velvety texture."}] },

{ slug:"lemon-drizzle-cake-mary-berry", title:"Lemon Drizzle Cake", inspiredBy:{chef:"Mary Berry",dish:"lemon drizzle cake"},
  description:"My Thermomix version of Mary Berry's lemon drizzle cake — tender crumb, crunchy lemon top.", image:"food-cake.jpg", category:"Baking", cuisine:"British",
  prepMin:15, cookMin:35, servings:10, keywords:["thermomix lemon drizzle cake","mary berry cake thermomix","lemon cake TM6"], datePublished:"2026-06-10", thermomixModel:"TM6 / TM7",
  intro:"Mary Berry's lemon drizzle is the cake everyone asks for. The Thermomix makes the batter in one bowl, and the warm lemon-sugar drizzle gives it that signature crackly top.",
  ingredients:["225 g butter, soft","225 g caster sugar","4 eggs","225 g self-raising flour","1 tsp baking powder","Zest of 2 lemons","For the drizzle: juice of 2 lemons + 85 g caster sugar"],
  steps:["Add the butter, sugar, eggs, flour, baking powder and lemon zest. Mix 25 sec / speed 5, scrape down, then 10 sec / speed 4 to a smooth batter.","Spoon into a lined loaf tin. Bake in a preheated oven at 180°C for 30–35 minutes, until golden and springy. (The Thermomix makes the batter; baking is done in your oven.)","Mix the lemon juice and 85 g sugar. Prick the warm cake all over and spoon the drizzle on so it soaks in. Cool in the tin."],
  tips:["Prick the warm cake well so the drizzle soaks right through.","Don't overmix once the flour is in."],
  faq:[{q:"No self-raising flour?",a:"Use plain flour plus 2 tsp baking powder."},{q:"Why drizzle while warm?",a:"A warm cake drinks up the lemon syrup and sets a crunchy top."}] },

{ slug:"lemon-curd-ina-garten", title:"Lemon Curd", inspiredBy:{chef:"Ina Garten",dish:"lemon curd"},
  description:"My Thermomix take on Ina Garten's lemon curd — glossy, tangy and impossible to scramble.", image:"dish-smoothie.jpg", category:"Snack", cuisine:"American",
  prepMin:5, cookMin:10, servings:8, keywords:["thermomix lemon curd","ina garten lemon curd thermomix","easy lemon curd TM6"], datePublished:"2026-06-09", thermomixModel:"TM6 / TM7",
  intro:"Lemon curd is one of those things the Thermomix was made for — it stirs and heats gently so the eggs never scramble. Ina's is bright, buttery and just sweet enough.",
  ingredients:["Zest and juice of 3 lemons","200 g caster sugar","3 eggs","90 g butter, cubed","1 pinch salt"],
  steps:["Add the lemon zest and sugar to the bowl and mill 10 sec / speed 9 to a fragrant lemon sugar.","Add the lemon juice, eggs, butter and salt. Cook 8 min / 80°C / speed 4 until thickened and glossy.","Pour into a sterilised jar and cool. It thickens more as it chills — keeps 2 weeks in the fridge."],
  tips:["The gentle 80°C is why it never scrambles.","Spread it on the Mary Berry lemon drizzle cake, scones or yoghurt."],
  faq:[{q:"Why won't the curd scramble in a Thermomix?",a:"Constant speed-4 stirring at a low 80°C cooks the eggs gently and evenly."},{q:"Can I freeze it?",a:"Yes, up to 3 months."}] },

{ slug:"spiced-chickpea-stew-alison-roman", title:"Spiced Chickpea Stew", inspiredBy:{chef:"Alison Roman",dish:"spiced chickpea stew (\"The Stew\")"},
  description:"My Thermomix version of Alison Roman's viral spiced chickpea & coconut stew.", image:"dish-bowl.jpg", category:"Dinner", cuisine:"Mediterranean",
  prepMin:10, cookMin:30, servings:4, keywords:["thermomix chickpea stew","alison roman the stew thermomix","coconut chickpea curry TM6"], datePublished:"2026-06-08", thermomixModel:"TM6 / TM7",
  intro:"Alison Roman's 'The Stew' broke the internet for good reason — turmeric, chickpeas and coconut, rich and golden. The Thermomix builds the whole thing in one bowl.",
  ingredients:["1 brown onion, halved","4 garlic cloves","30 g fresh ginger","30 g olive oil","1.5 tsp ground turmeric","1 tsp ground cumin","2 x 400 g tins chickpeas, drained","400 g coconut milk","200 g vegetable stock","100 g greens (kale or spinach)","Salt and lemon, to finish"],
  steps:["Place onion, garlic and ginger in the bowl and chop 5 sec / speed 5. Scrape down.","Add the oil, turmeric and cumin and sauté 3 min / 120°C / speed 1.","Add the chickpeas, coconut milk and stock. Cook 20 min / 100°C / Reverse / speed 1, MC off and basket on the lid.","Add the greens and cook 4 min / 100°C / Reverse / speed 1. Finish with salt and a squeeze of lemon."],
  tips:["Lightly crush a few chickpeas first to thicken the stew.","Serve over rice or with toasted flatbread."],
  faq:[{q:"Is this vegan?",a:"Yes — it's naturally vegan and gluten-free."},{q:"Can I add protein?",a:"Stir through shredded chicken at the end, or keep it as is."}] },

{ slug:"tarka-dal-madhur-jaffrey", title:"Tarka Dal", inspiredBy:{chef:"Madhur Jaffrey",dish:"tarka dal"},
  description:"My Thermomix take on Madhur Jaffrey's tarka dal — creamy lentils with a sizzling spiced topping.", image:"food-soup.jpg", category:"Dinner", cuisine:"Indian",
  prepMin:10, cookMin:30, servings:4, keywords:["thermomix dal","madhur jaffrey tarka dal thermomix","red lentil dal TM6"], datePublished:"2026-06-07", thermomixModel:"TM6 / TM7",
  intro:"Madhur Jaffrey taught the world to cook Indian food at home. Her tarka dal is pure comfort — soft lentils finished with a fragrant tempered-spice topping. The Thermomix cooks the lentils hands-free.",
  ingredients:["250 g red lentils, rinsed","800 g water","1 tsp ground turmeric","1 tsp salt","For the tarka: 30 g ghee or oil","1 brown onion, halved","3 garlic cloves","1 tsp cumin seeds","1 dried chilli","1 tomato, quartered"],
  steps:["Place the lentils, water, turmeric and salt in the bowl. Cook 20 min / 100°C / speed 1, basket on the lid. Blend 5 sec / speed 4 for a creamy dal, then pour into a serving bowl.","For the tarka, place the onion and garlic in the bowl and chop 4 sec / speed 5.","Add the ghee, cumin seeds, dried chilli and tomato and sauté 6 min / 120°C / speed 1.","Stir the tarka through the dal and serve with rice or flatbread."],
  tips:["The tarka — tempered spices poured over at the end — is the soul of the dish.","A squeeze of lemon and fresh coriander lift it beautifully."],
  faq:[{q:"Which lentils should I use?",a:"Red lentils (masoor dal) cook fastest and go lovely and creamy."},{q:"Can I make it richer?",a:"Stir a spoon of butter or coconut milk through at the end."}] },

{ slug:"hainanese-chicken-rice-adam-liaw", title:"Hainanese Chicken Rice", inspiredBy:{chef:"Adam Liaw",dish:"Hainanese chicken rice"},
  description:"My Thermomix version of Adam Liaw's Hainanese chicken rice — silky poached chicken and fragrant rice, cooked together.", image:"hero-table.jpg", category:"Dinner", cuisine:"Singaporean",
  prepMin:15, cookMin:25, servings:4, keywords:["thermomix chicken rice","adam liaw hainanese chicken rice thermomix","varoma chicken rice TM7"], datePublished:"2026-06-06", thermomixModel:"TM6 / TM7",
  intro:"Adam Liaw's Hainanese chicken rice is comfort food perfected. The Thermomix does the clever bit — the rice cooks in the bowl while the chicken steams above it in the Varoma, soaking up all the flavour.",
  ingredients:["500 g chicken thigh fillets","20 g fresh ginger","2 spring onions","2 garlic cloves","30 g oil","300 g jasmine rice, rinsed","360 g chicken stock","To serve: soy, sliced cucumber, chilli-ginger sauce"],
  steps:["Place the garlic and ginger in the bowl and chop 3 sec / speed 7. Add the oil and sauté 3 min / 120°C / speed 1.","Add the rinsed rice and toast 2 min / 100°C / Reverse / speed 1, then add the stock.","Rub the chicken with a little ginger and the spring onions and place in the Varoma dish. Set the Varoma in position. Cook 25 min / Varoma / Reverse / speed 1 — the rice cooks below while the chicken steams above.","Rest the chicken 5 minutes, slice and serve over the rice with soy, cucumber and chilli-ginger sauce."],
  tips:["Steaming keeps the chicken silky — that's the Hainanese way.","Check the chicken reaches 75°C in the thickest part."],
  faq:[{q:"Can the Thermomix cook the chicken and rice together?",a:"Yes — the rice cooks in the bowl and the chicken steams in the Varoma above, in one 25-minute step."},{q:"Breast or thigh?",a:"Thigh stays juicier when steamed."}] },

{ slug:"fig-vanilla-jam-maggie-beer", title:"Fig & Vanilla Jam", inspiredBy:{chef:"Maggie Beer",dish:"fig jam"},
  description:"My Thermomix take on Maggie Beer's fig & vanilla jam — glossy, not too sweet, perfect with cheese.", image:"dish-bread2.jpg", category:"Snack", cuisine:"Australian",
  prepMin:10, cookMin:30, servings:16, keywords:["thermomix fig jam","maggie beer fig jam thermomix","fig vanilla jam TM6"], datePublished:"2026-06-05", thermomixModel:"TM6 / TM7",
  intro:"Maggie Beer is the queen of figs. This jam is jammy and grown-up — lovely on toast, but unbeatable next to a sharp cheese. The Thermomix stirs it for you so it never catches.",
  ingredients:["600 g fresh figs, chopped","400 g sugar","Juice of 1 lemon","1 vanilla bean, split (or 1 tsp vanilla paste)"],
  steps:["Place the figs, sugar, lemon juice and vanilla in the mixing bowl. Cook 5 min / 100°C / speed 1 to get it going.","Cook 25 min / Varoma / Reverse / speed 1, MC off, until thick and jammy.","Spoon into warm sterilised jars and seal."],
  tips:["The lemon juice helps the jam set.","Beautiful with a sharp cheddar or on warm sourdough."],
  faq:[{q:"How long does the jam keep?",a:"Sealed jars keep for months; once opened, about 3 weeks in the fridge."},{q:"Dried figs?",a:"Use fresh for this — dried will be too dense."}] },

{ slug:"orange-almond-cake-claudia-roden", title:"Orange & Almond Cake", inspiredBy:{chef:"Claudia Roden",dish:"orange & almond cake"},
  description:"My Thermomix version of Claudia Roden's famous flourless orange & almond cake — impossibly moist and gluten-free.", image:"dish-dessert.jpg", category:"Dessert", cuisine:"Middle Eastern",
  prepMin:15, cookMin:50, servings:10, keywords:["thermomix orange almond cake","claudia roden orange cake thermomix","flourless cake TM6"], datePublished:"2026-06-04", thermomixModel:"TM6 / TM7",
  intro:"Claudia Roden's whole-orange almond cake is a legend — flourless, fragrant and so moist it barely keeps. The Thermomix softens the oranges and makes the batter, skin and all.",
  ingredients:["2 whole oranges","250 g almond meal","250 g caster sugar","6 eggs","1 tsp baking powder"],
  steps:["Place the whole oranges in the bowl with 500 g water. Cook 30 min / 100°C / speed 1 until very soft, then drain and cool slightly.","Blend the cooked oranges (skin and all) 20 sec / speed 6 to a smooth purée.","Add the eggs, sugar, almond meal and baking powder. Mix 20 sec / speed 5.","Pour into a lined 22 cm tin. Bake in a preheated oven at 170°C for 50 minutes, until set. (The Thermomix makes the batter; baking is done in your oven.)"],
  tips:["Using the whole orange, skin and all, gives the signature bittersweet depth.","Naturally gluten-free thanks to the almond meal."],
  faq:[{q:"Is this cake really flourless?",a:"Yes — almond meal replaces flour, so it's gluten-free and beautifully moist."},{q:"Why boil the oranges first?",a:"Softening them mellows the bitterness of the peel."}] },

{ slug:"coconut-fish-curry-rick-stein", title:"Coconut Fish Curry", inspiredBy:{chef:"Rick Stein",dish:"coconut fish curry"},
  description:"My Thermomix take on Rick Stein's coconut fish curry — fragrant, gentle, and the fish stays whole.", image:"food-risotto.jpg", category:"Dinner", cuisine:"Indian",
  prepMin:15, cookMin:20, servings:4, keywords:["thermomix fish curry","rick stein fish curry thermomix","coconut fish curry TM6"], datePublished:"2026-06-03", thermomixModel:"TM6 / TM7",
  intro:"Rick Stein has spent a lifetime chasing the perfect fish curry. This one is light and aromatic, and the Thermomix cooks the fish so gently it stays in beautiful whole pieces.",
  ingredients:["1 brown onion, halved","3 garlic cloves","20 g fresh ginger","2 tbsp mild curry paste","30 g oil","400 g coconut milk","100 g water","1 tbsp tamarind paste (or lime juice)","600 g firm white fish, in chunks","Coriander and salt, to finish"],
  steps:["Place onion, garlic and ginger in the bowl and chop 4 sec / speed 5. Scrape down.","Add the oil and curry paste and sauté 3 min / 120°C / speed 1.","Add the coconut milk, water and tamarind. Cook 8 min / 100°C / speed 2.","Add the fish chunks and cook 8 min / 90°C / Reverse / speed 1 — gentle so the fish stays whole. Finish with coriander, lime and salt. Serve with rice."],
  tips:["The low 90°C on Reverse keeps the fish from breaking up.","Use a firm white fish like snapper or ling."],
  faq:[{q:"Won't the fish fall apart in the Thermomix?",a:"No — cooking at 90°C on Reverse speed 1 is gentle enough to keep the pieces whole."},{q:"Can I use prawns?",a:"Yes — add them for the last 5 minutes."}] },

{ slug:"chicken-laksa-poh-ling-yeow", title:"Chicken Laksa", inspiredBy:{chef:"Poh Ling Yeow",dish:"chicken laksa"},
  description:"My Thermomix version of Poh Ling Yeow's chicken laksa — a fragrant coconut noodle soup from a homemade paste.", image:"dish-pasta.jpg", category:"Dinner", cuisine:"Malaysian",
  prepMin:15, cookMin:25, servings:4, keywords:["thermomix laksa","poh ling yeow laksa thermomix","chicken laksa paste TM6"], datePublished:"2026-06-02", thermomixModel:"TM6 / TM7",
  intro:"Poh Ling Yeow's laksa is a bowl of pure comfort. The Thermomix makes the spice paste from scratch in seconds, then builds the rich coconut broth — restaurant laksa at home.",
  ingredients:["For the paste: 1 onion, 3 garlic cloves, 20 g ginger, 2 chillies, 20 g lemongrass, 1 tsp turmeric","30 g oil","400 g coconut milk","500 g chicken stock","1 tbsp fish sauce","400 g chicken thigh, sliced","To serve: rice noodles, bean sprouts, tofu puffs, lime, coriander"],
  steps:["Place all the paste ingredients in the bowl and blend 8 sec / speed 8 to a paste. Scrape down.","Add the oil and fry the paste 5 min / 120°C / speed 1 to release the aroma.","Add the coconut milk, stock, fish sauce and sliced chicken. Cook 18 min / 100°C / Reverse / speed 1.","Serve over cooked rice noodles with bean sprouts, tofu puffs, lime and coriander."],
  tips:["Frying the paste in step 2 is what builds the deep flavour.","Make a double batch of paste and freeze half."],
  faq:[{q:"Is there a shortcut?",a:"Use 3 tablespoons of shop-bought laksa paste and skip step 1."},{q:"Can I make it vegetarian?",a:"Swap the chicken for tofu and mushrooms and use vegetable stock."}] },
];

let written = 0, skipped = 0;
for (const r of R) {
  const f = join(DATA, `${r.slug}.json`);
  if (existsSync(f)) { skipped++; continue; }
  writeFileSync(f, JSON.stringify(r, null, 2) + "\n");
  written++;
}
console.log(`Batch: ${written} written, ${skipped} skipped (already existed). Total in batch: ${R.length}`);
