// Rewrites the generic-template ("main ingredient prepared for the dish") recipes
// with REAL, dish-specific ingredients + Thermomix steps. Preserves slug, inspiredBy,
// image, datePublished, thermomixModel, cuisine, keywords. Run: node scripts/rewrite-bad.mjs
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "recipes", "data");

// slug -> real recipe content
const R = {
"butter-chicken-madhur-jaffrey": { title:"Butter Chicken", category:"Dinner", prepMin:15, cookMin:30, servings:4,
  description:"My Thermomix take on Madhur Jaffrey's butter chicken — creamy, spiced and rich, all in one bowl.",
  ingredients:["1 onion, halved","3 garlic cloves","20 g ginger","30 g butter","2 tbsp tomato paste","1 tbsp garam masala","1 tsp cumin","1 tsp paprika","400 g chopped tomatoes","100 g cream","600 g chicken thigh, diced","Salt, coriander, to serve"],
  steps:["Chop onion, garlic and ginger 5 sec / speed 5. Scrape down.","Add butter and spices and sauté 3 min / 120°C / speed 1.","Add tomato paste, tomatoes and the diced chicken. Cook 20 min / 100°C / Reverse / speed 1, MC off.","Add the cream and cook 3 min / 90°C / Reverse / speed 1. Season and finish with coriander. Serve with rice or naan."],
  tips:["Thigh stays tender; add a pinch of sugar to round the tomatoes.","For extra silk, blend the sauce before adding the chicken."], faq:[{q:"Can I use chicken breast?",a:"Yes, but dice it larger and add for the last 12 minutes so it doesn't dry out."}] },

"cauliflower-cheese-gordon-ramsay": { title:"Cauliflower Cheese", category:"Dinner", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix version of Gordon Ramsay's cauliflower cheese — a silky mustard-cheddar sauce over tender cauliflower.",
  ingredients:["1 cauliflower, in florets","200 g cheddar, cubed","40 g butter","40 g plain flour","600 g milk","1 tsp Dijon mustard","1 pinch nutmeg","Salt and pepper"],
  steps:["Steam the cauliflower in the Varoma: add 500 g water to the bowl, florets in the Varoma dish, 18 min / Varoma / speed 1. Set aside in a baking dish.","Empty the bowl. Grate the cheddar 8 sec / speed 8; set aside.","Add butter, flour and milk. Cook 8 min / 90°C / speed 4 to a smooth white sauce.","Add the cheese, mustard and nutmeg. Mix 20 sec / speed 4. Season, pour over the cauliflower and grill a few minutes to brown."],
  tips:["Grating the cheese in the bowl keeps the sauce silky, never grainy.","Top with breadcrumbs before grilling for crunch."], faq:[{q:"Can I cook the cauliflower in the sauce?",a:"Steam it first so it stays firm — boiling it in the sauce makes it watery."}] },

"apple-cinnamon-porridge-annabel-langbein": { title:"Apple & Cinnamon Porridge", category:"Breakfast", prepMin:5, cookMin:12, servings:2,
  description:"My Thermomix take on Annabel Langbein's apple porridge — creamy oats with soft cinnamon apple, made in minutes.",
  ingredients:["80 g rolled oats","400 g milk (or milk of choice)","1 apple, grated","1/2 tsp ground cinnamon","1 tbsp honey or maple syrup","1 pinch salt","Yoghurt and nuts, to serve"],
  steps:["Place the oats, milk, grated apple, cinnamon, honey and salt in the mixing bowl.","Cook 10 min / 90°C / speed 1, until creamy and thick.","Rest 1 minute (it thickens more), then spoon into bowls and top with yoghurt and nuts."],
  tips:["Like it thicker? Add 10 g more oats. Thinner? A splash more milk.","Stir through sultanas or a grated pear for variety."], faq:[{q:"Can I use steel-cut oats?",a:"Yes, but cook 25 min / 90°C / speed 1 and add a little more milk."}] },

"banana-buttermilk-pancakes-stephanie-alexander": { title:"Banana Buttermilk Pancakes", category:"Breakfast", prepMin:10, cookMin:15, servings:4,
  description:"My Thermomix take on Stephanie Alexander's pancakes — fluffy buttermilk pancakes with sweet mashed banana.",
  ingredients:["2 ripe bananas","2 eggs","300 g buttermilk","200 g self-raising flour","30 g sugar","1 pinch salt","Butter, for cooking","Honey, to serve"],
  steps:["Add the bananas, eggs and buttermilk. Mix 15 sec / speed 5.","Add the flour, sugar and salt. Mix 15 sec / speed 4 to a smooth batter — don't overmix.","Rest 5 minutes. Cook spoonfuls in a buttered pan, about 2 minutes each side, until golden. Serve with honey."],
  tips:["The buttermilk is what makes them tall and fluffy.","Fold a handful of blueberries through at the end if you like."], faq:[{q:"No buttermilk?",a:"Stir 1 tbsp lemon juice into 300 g milk and rest 5 minutes."}] },

"beetroot-goat-cheese-risotto-maggie-beer": { title:"Beetroot & Goat's Cheese Risotto", category:"Dinner", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix take on a Maggie Beer-style beetroot risotto — vivid pink, creamy, with tangy goat's cheese.",
  ingredients:["1 onion, halved","2 garlic cloves","30 g olive oil","2 beetroots, grated","320 g arborio rice","100 g white wine","800 g hot vegetable stock","80 g goat's cheese","Salt, pepper, dill"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil, sauté 3 min / 120°C / speed 1.","Add the grated beetroot and cook 4 min / 120°C / Reverse / speed 1.","Add rice and wine, cook 2 min / 100°C / Reverse / speed 1. Add the hot stock, cook 16 min / 100°C / Reverse / speed 1, MC off.","Stir through the goat's cheese, season and rest 2 minutes. Finish with dill."],
  tips:["Grating the beetroot melts it into the rice for that vivid colour.","A squeeze of lemon lifts the earthiness."], faq:[{q:"Can I use cooked beetroot?",a:"Yes — add it grated at step 3 and cut the cook time slightly."}] },

"broccoli-orecchiette-jamie-oliver": { title:"Broccoli Orecchiette", category:"Dinner", prepMin:10, cookMin:20, servings:4,
  description:"My Thermomix take on Jamie Oliver's broccoli orecchiette — garlicky, chilli-flecked and silky.",
  ingredients:["3 garlic cloves","1 red chilli","30 g olive oil","2 anchovy fillets (optional)","400 g broccoli, chopped","100 g vegetable stock","Parmesan, to serve","300 g orecchiette, cooked"],
  steps:["Chop garlic and chilli 3 sec / speed 6. Add oil and anchovies, sauté 3 min / 120°C / speed 1.","Add the broccoli and stock. Cook 12 min / 100°C / Reverse / speed 1 until very soft.","Crush lightly with the spatula to a rough sauce, season. Toss through the cooked orecchiette with a splash of pasta water and parmesan."],
  tips:["Cooking the broccoli right down is the point — it becomes the sauce.","A little reserved pasta water makes it glossy."], faq:[{q:"Can I leave out the anchovy?",a:"Yes — add an extra pinch of salt and a little more parmesan."}] },

"baked-ricotta-figs-yotam-ottolenghi": { title:"Baked Ricotta with Figs", category:"Snack", prepMin:10, cookMin:25, servings:6,
  description:"My Thermomix take on an Ottolenghi-style baked ricotta with honeyed figs — creamy, savoury-sweet, for sharing.",
  ingredients:["500 g ricotta","2 eggs","40 g parmesan, grated","1 lemon, zested","Salt and pepper","6 figs, halved","2 tbsp honey","Thyme, to serve"],
  steps:["Grate the parmesan 8 sec / speed 8. Add ricotta, eggs, lemon zest, salt and pepper. Mix 20 sec / speed 4.","Spoon into an oiled dish and bake at 180°C for 25 minutes until just set. (The Thermomix makes the mix; baking is in your oven.)","Top with the figs, drizzle with honey and scatter thyme. Serve warm with bread."],
  tips:["Drain wet ricotta first so it sets firm.","Lovely with roasted grapes instead of figs."], faq:[{q:"Sweet or savoury?",a:"It sits in between — gorgeous as a starter with bread, or as a light dessert."}] },

"chilli-crab-pasta-kylie-kwong": { title:"Chilli Crab Pasta", category:"Dinner", prepMin:10, cookMin:15, servings:4,
  description:"My Thermomix take on a Kylie Kwong-style chilli crab — fragrant, gingery and tossed through pasta.",
  ingredients:["3 garlic cloves","20 g ginger","1-2 red chillies","30 g oil","2 tbsp tomato paste","200 g passata","1 tbsp soy sauce","200 g crab meat","300 g spaghetti, cooked","Spring onion, coriander"],
  steps:["Chop garlic, ginger and chilli 4 sec / speed 6. Add oil, sauté 3 min / 120°C / speed 1.","Add tomato paste, passata and soy. Cook 8 min / 100°C / speed 1.","Add the crab and warm 2 min / 90°C / Reverse / speed 1. Toss through the cooked spaghetti with spring onion and coriander."],
  tips:["Add the crab gently at the end so it stays in lovely pieces.","A squeeze of lime brightens it."], faq:[{q:"Fresh or tinned crab?",a:"Both work — drain tinned crab well first."}] },

"chocolate-hazelnut-spread-ferrandi": { title:"Chocolate Hazelnut Spread", category:"Snack", prepMin:5, cookMin:10, servings:12,
  description:"My Thermomix homemade chocolate-hazelnut spread — glossy, rich and far better than the jar.",
  ingredients:["200 g hazelnuts, roasted","150 g dark chocolate, broken","60 g icing sugar","30 g cocoa","40 g neutral oil","1 pinch salt"],
  steps:["Mill the hazelnuts 1 min / speed 9, scraping, until they turn to a smooth butter.","Add the chocolate and melt 4 min / 50°C / speed 2.","Add the icing sugar, cocoa, oil and salt. Blend 1 min / speed 6 until glossy. Pour into a jar — it thickens as it cools."],
  tips:["The longer you mill the hazelnuts, the silkier the spread.","Warm gently to make it spreadable again after chilling."], faq:[{q:"How long does it keep?",a:"Up to 3 weeks in a sealed jar at room temperature."}] },

"coconut-pumpkin-curry-madhur-jaffrey": { title:"Coconut Pumpkin Curry", category:"Dinner", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix coconut pumpkin curry inspired by Madhur Jaffrey — golden, creamy and gently spiced.",
  ingredients:["1 onion, halved","3 garlic cloves","20 g ginger","30 g oil","1 tbsp curry powder","1 tsp turmeric","700 g pumpkin, in 3 cm cubes","400 g coconut milk","150 g stock","100 g spinach","Salt, lime"],
  steps:["Chop onion, garlic and ginger 5 sec / speed 5. Add oil and spices, sauté 3 min / 120°C / speed 1.","Add pumpkin, coconut milk and stock. Cook 20 min / 100°C / Reverse / speed 1, MC off.","Stir through the spinach, cook 3 min / 100°C / Reverse / speed 1. Finish with salt and lime. Serve with rice."],
  tips:["Keep the pumpkin in even cubes so it cooks evenly on Reverse.","Add a sliced chilli for heat."], faq:[{q:"Vegan?",a:"Yes — naturally vegan and gluten-free."}] },

"coconut-lime-fish-curry-neil-perry": { title:"Coconut & Lime Fish Curry", category:"Dinner", prepMin:12, cookMin:18, servings:4,
  description:"My Thermomix take on a Neil Perry-style coconut fish curry — light, zingy and the fish stays whole.",
  ingredients:["1 onion, halved","3 garlic cloves","20 g ginger","2 tbsp green curry paste","30 g oil","400 g coconut milk","100 g stock","1 tbsp fish sauce","Juice of 1 lime","600 g firm white fish, in chunks","Coriander, to serve"],
  steps:["Chop onion, garlic and ginger 4 sec / speed 5. Add oil and curry paste, sauté 3 min / 120°C / speed 1.","Add coconut milk, stock, fish sauce. Cook 6 min / 100°C / speed 2.","Add the fish and cook 8 min / 90°C / Reverse / speed 1 — gentle, so it stays whole. Finish with lime and coriander."],
  tips:["Low 90°C on Reverse keeps the fish in beautiful pieces.","Add green beans with the fish for crunch."], faq:[{q:"Which fish is best?",a:"A firm white fish like snapper, ling or barramundi."}] },

"corn-fritters-bill-granger": { title:"Sweetcorn Fritters", category:"Breakfast", prepMin:10, cookMin:15, servings:4,
  description:"My Thermomix take on Bill Granger's famous corn fritters — golden, fluffy and packed with sweetcorn.",
  ingredients:["2 eggs","100 g milk","100 g plain flour","1 tsp baking powder","300 g sweetcorn kernels","2 spring onions","Salt, pepper","Butter, for cooking"],
  steps:["Add the spring onions to the bowl, chop 3 sec / speed 5.","Add eggs, milk, flour, baking powder, salt and pepper. Mix 15 sec / speed 4.","Add the sweetcorn and mix 8 sec / Reverse / speed 3 to fold in. Cook spoonfuls in a buttered pan, 2 minutes each side."],
  tips:["Reverse blade folds the corn in without crushing it.","Serve with avocado, bacon and a squeeze of lime."], faq:[{q:"Frozen or tinned corn?",a:"Both work — thaw or drain well first."}] },

"eggplant-tomato-stew-yasmin-khan": { title:"Eggplant & Tomato Stew", category:"Dinner", prepMin:10, cookMin:30, servings:4,
  description:"My Thermomix take on a Yasmin Khan-style aubergine stew — soft eggplant in a rich, spiced tomato sauce.",
  ingredients:["1 onion, halved","3 garlic cloves","30 g olive oil","1 tsp cumin","1 tsp cinnamon","2 eggplants, cubed","400 g chopped tomatoes","150 g stock","Salt, parsley, yoghurt"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil and spices, sauté 3 min / 120°C / speed 1.","Add the eggplant, tomatoes and stock. Cook 28 min / 100°C / Reverse / speed 1, MC off, until meltingly soft.","Season and serve with parsley, a swirl of yoghurt and flatbread."],
  tips:["Salting the eggplant first draws out bitterness if you have time.","A spoon of pomegranate molasses adds a beautiful tang."], faq:[{q:"Vegan?",a:"Yes — skip the yoghurt or use a plant-based one."}] },

"fish-pie-rick-stein": { title:"Fish Pie", category:"Dinner", prepMin:20, cookMin:30, servings:4,
  description:"My Thermomix take on Rick Stein's fish pie — a creamy seafood filling under fluffy mash. The Thermomix makes both.",
  ingredients:["600 g potatoes, cubed","40 g butter","40 g plain flour","500 g milk","1 tsp Dijon mustard","500 g mixed fish & prawns, in chunks","Handful parsley","Salt, pepper","50 g cheddar, grated"],
  steps:["Steam the potatoes: 500 g water in the bowl, potatoes in the Varoma, 20 min / Varoma / speed 1. Mash with half the butter and a splash of milk; set aside. Empty the bowl.","Add the remaining butter, flour and milk. Cook 8 min / 90°C / speed 4 to a smooth sauce. Add mustard, parsley, season.","Fold the raw fish into the warm sauce, pour into a dish, top with mash and cheese. Bake 180°C for 25 minutes until golden. (Oven finish.)"],
  tips:["The raw fish cooks through in the oven — don't pre-cook it.","Add a few boiled eggs to the filling, Rick-style."], faq:[{q:"Can I make it ahead?",a:"Yes — assemble, chill, and bake when ready (add 10 minutes from cold)."}] },

"green-shakshuka-ottolenghi": { title:"Green Shakshuka", category:"Breakfast", prepMin:10, cookMin:18, servings:4,
  description:"My Thermomix take on Ottolenghi's green shakshuka — eggs poached in a garlicky pan of greens.",
  ingredients:["1 onion, halved","3 garlic cloves","30 g olive oil","1 tsp cumin","200 g spinach","100 g kale","100 g stock","50 g feta","4 eggs","Salt, pepper"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil and cumin, sauté 3 min / 120°C / speed 1.","Add the greens and stock. Cook 6 min / 100°C / Reverse / speed 1 until wilted. Season and pour into a wide pan.","Make 4 wells, crack in the eggs, scatter feta, cover and cook on the stove 5–6 minutes until the whites set. (Stovetop finish.)"],
  tips:["The Thermomix makes the green base; poach the eggs in a pan for the classic look.","A pinch of chilli and a squeeze of lemon lift it."], faq:[{q:"Make it vegan?",a:"Skip the eggs and feta; fold in chickpeas instead."}] },

"honey-soy-chicken-adam-liaw": { title:"Honey Soy Chicken", category:"Dinner", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix take on Adam Liaw's honey soy chicken — sticky, savoury-sweet, with rice steamed at the same time.",
  ingredients:["3 garlic cloves","20 g ginger","60 g soy sauce","40 g honey","20 g rice vinegar","600 g chicken thigh, diced","For the rice: 300 g jasmine rice, rinsed + 360 g water","Spring onion, sesame"],
  steps:["Chop garlic and ginger 3 sec / speed 7. Add soy, honey, vinegar and the chicken to the bowl. Put the rinsed rice and water in the Varoma dish; set the Varoma in position.","Cook 25 min / Varoma / Reverse / speed 1 — the chicken simmers below while the rice steams above.","Lift out the Varoma. Reduce the sauce 4 min / Varoma / Reverse / speed 1 until sticky. Serve over rice with spring onion and sesame."],
  tips:["The Varoma cooks chicken and rice in one go — that's the magic.","Reduce at the end for that glossy, sticky glaze."], faq:[{q:"Breast or thigh?",a:"Thigh stays juicy and soaks up the glaze better."}] },

"lemon-garlic-prawns-rick-stein": { title:"Lemon Garlic Prawns", category:"Dinner", prepMin:8, cookMin:10, servings:4,
  description:"My Thermomix take on Rick Stein's garlic prawns — buttery, lemony and quick, tossed with parsley.",
  ingredients:["4 garlic cloves","60 g butter","30 g olive oil","1 lemon (juice + zest)","1 pinch chilli flakes","600 g raw prawns, peeled","Salt, parsley","Crusty bread, to serve"],
  steps:["Chop garlic 3 sec / speed 6. Add butter, oil, lemon zest and chilli, sauté 3 min / 120°C / speed 1.","Add the prawns and cook 6 min / 100°C / Reverse / speed 1, until just pink.","Finish with lemon juice, salt and parsley. Serve with bread to mop the butter."],
  tips:["Don't overcook — prawns are done the moment they turn pink.","A splash of white wine at step 1 is lovely."], faq:[{q:"Frozen prawns?",a:"Thaw and pat dry first so they sear rather than stew."}] },

"lemon-ricotta-pasta-samin-nosrat": { title:"Lemon Ricotta Pasta", category:"Dinner", prepMin:5, cookMin:10, servings:4,
  description:"My Thermomix take on a Samin Nosrat-style lemon ricotta pasta — silky, bright and ready in minutes.",
  ingredients:["250 g ricotta","1 lemon (juice + zest)","40 g parmesan, grated","30 g olive oil","Salt, pepper","300 g pasta, cooked","Basil, to serve"],
  steps:["Grate the parmesan 8 sec / speed 8. Add ricotta, lemon zest and juice, olive oil, salt and pepper. Mix 20 sec / speed 4 to a smooth sauce.","Loosen with a little hot pasta water (mix 10 sec / speed 3). Toss through the cooked pasta and finish with basil."],
  tips:["A spoon of pasta water makes the sauce cling and gloss.","Add peas or rocket for colour."], faq:[{q:"No ricotta?",a:"Mascarpone or cottage cheese (blended) both work."}] },

"lemon-herb-roast-chicken-maggie-beer": { title:"Lemon & Herb Chicken", category:"Dinner", prepMin:15, cookMin:35, servings:4,
  description:"My Thermomix take on a Maggie Beer-style lemon herb chicken — juicy chicken with a fragrant pan sauce.",
  ingredients:["1 onion, halved","3 garlic cloves","30 g olive oil","1 lemon, zested + juiced","Handful herbs (thyme, rosemary)","600 g chicken thigh fillets","200 g stock","Salt, pepper"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil, lemon zest and herbs, sauté 3 min / 120°C / speed 1.","Add the chicken, stock and lemon juice. Cook 25 min / 100°C / Reverse / speed 1, MC off.","Lift out the chicken; reduce the sauce 5 min / Varoma / Reverse / speed 1. Season and pour over. (For golden skin, finish thighs under the grill.)"],
  tips:["Reduce the sauce at the end for real depth.","Lovely over mash or with crusty bread."], faq:[{q:"Bone-in chicken?",a:"Yes — add 10 minutes and make sure it reaches 75°C inside."}] },

"lentil-shepherds-pie-tom-kerridge": { title:"Lentil Shepherd's Pie", category:"Dinner", prepMin:15, cookMin:35, servings:4,
  description:"My Thermomix take on a Tom Kerridge-style lentil shepherd's pie — hearty, meat-free, under fluffy mash.",
  ingredients:["600 g potatoes, cubed","40 g butter","1 onion, halved","1 carrot","2 garlic cloves","30 g oil","150 g green lentils","2 tbsp tomato paste","500 g stock","1 tsp thyme","Salt, pepper"],
  steps:["Steam the potatoes: 500 g water in the bowl, potatoes in the Varoma, 20 min / Varoma / speed 1. Mash with butter; set aside. Empty the bowl.","Chop onion, carrot and garlic 5 sec / speed 5. Add oil, sauté 4 min / 120°C / speed 1.","Add lentils, tomato paste, stock and thyme. Cook 28 min / 100°C / Reverse / speed 1 until tender. Season, spread in a dish, top with mash and bake 180°C for 15 minutes."],
  tips:["Crush a few lentils to thicken the filling.","A splash of soy or Worcestershire deepens the flavour."], faq:[{q:"Do the lentils need soaking?",a:"No — green lentils cook from dry in the sauce."}] },

"lemon-tahini-broccoli-anna-jones": { title:"Lemon Tahini Broccoli", category:"Lunch", prepMin:8, cookMin:12, servings:4,
  description:"My Thermomix take on an Anna Jones-style broccoli with lemon tahini — bright, nutty and good warm or cold.",
  ingredients:["400 g broccoli, in florets","60 g tahini","1 lemon (juice)","1 garlic clove","40 g water","Salt","Toasted seeds, to serve"],
  steps:["Steam the broccoli: 500 g water in the bowl, florets in the Varoma, 12 min / Varoma / speed 1. Set aside. Empty the bowl.","Add garlic, tahini, lemon juice, water and salt. Blend 20 sec / speed 6 to a creamy dressing.","Spoon the dressing over the warm broccoli and scatter with toasted seeds."],
  tips:["Loosen the dressing with more water if it's thick.","Great over any steamed green — beans, kale, cauliflower."], faq:[{q:"Serve warm or cold?",a:"Both — it's lovely warm and just as good cold the next day."}] },

"lemony-chickpea-soup-alison-roman": { title:"Lemony Chickpea Soup", category:"Lunch", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix take on an Alison Roman-style lemony chickpea soup — creamy, bright and comforting.",
  ingredients:["1 onion, halved","3 garlic cloves","30 g olive oil","1 tsp cumin","2 x 400 g tins chickpeas, drained","700 g stock","1 lemon (juice)","100 g spinach","Salt, pepper"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil and cumin, sauté 3 min / 120°C / speed 1.","Add the chickpeas and stock. Cook 18 min / 100°C / speed 1. Blend half (1 min / speed 6 with the spatula) for a creamy-but-chunky texture, or leave whole.","Stir through spinach and lemon, season. Cook 3 min / 100°C / Reverse / speed 1."],
  tips:["Blending half thickens it without cream.","Finish with chilli oil and good olive oil."], faq:[{q:"Vegan?",a:"Yes — completely plant-based."}] },

"miso-eggplant-nobu-matsuhisa": { title:"Miso Glazed Eggplant", category:"Dinner", prepMin:10, cookMin:20, servings:4,
  description:"My Thermomix take on Nobu's miso eggplant (nasu dengaku) — soft eggplant under a sweet, savoury miso glaze.",
  ingredients:["2 eggplants, halved","60 g white miso","30 g mirin","20 g sugar","20 g sake (or water)","Sesame seeds, spring onion"],
  steps:["Make the glaze: add miso, mirin, sugar and sake to the bowl. Cook 5 min / 90°C / speed 2 until glossy; set aside.","Steam the eggplant: rinse the bowl, add 500 g water, eggplant halves (scored) in the Varoma, 15 min / Varoma / speed 1 until soft.","Brush the eggplant with the glaze and grill 3–4 minutes until caramelised. Top with sesame and spring onion. (Grill finish.)"],
  tips:["Score the cut side so the eggplant soaks up the glaze.","The grill at the end gives that bubbling, caramelised top."], faq:[{q:"What miso?",a:"White (shiro) miso is sweeter and traditional here."}] },

"miso-butter-corn-adam-liaw": { title:"Miso Butter Corn", category:"Snack", prepMin:5, cookMin:15, servings:4,
  description:"My Thermomix take on an Adam Liaw-style miso butter corn — sweet corn in a rich, savoury miso butter.",
  ingredients:["4 corn cobs (or 400 g kernels)","40 g butter","20 g white miso","1 tsp sugar","Spring onion, to serve"],
  steps:["Steam the corn: 500 g water in the bowl, corn in the Varoma, 15 min / Varoma / speed 1 (kernels need only 8 min). Set aside. Empty the bowl.","Add butter, miso and sugar. Warm 3 min / 90°C / speed 2 until smooth.","Brush or toss the corn in the miso butter. Scatter with spring onion."],
  tips:["Miso + butter is pure umami — don't skip the sugar, it balances the salt.","Char the cobs on a grill after glazing for smokiness."], faq:[{q:"Cobs or kernels?",a:"Both work — kernels are quicker and easier to toss."}] },

"mango-coconut-lassi-poh-ling-yeow": { title:"Mango Coconut Lassi", category:"Drink", prepMin:5, cookMin:0, servings:2,
  description:"My Thermomix take on a Poh-style mango coconut lassi — thick, creamy and ready in one minute.",
  ingredients:["250 g mango (fresh or frozen)","150 g yoghurt","100 g coconut milk","1 tbsp honey","1 pinch cardamom","Ice, to serve"],
  steps:["Place the mango, yoghurt, coconut milk, honey and cardamom in the bowl.","Blend 1 min / speed 9 until smooth and creamy. Pour over ice."],
  tips:["Frozen mango makes it thick and frosty — skip the ice.","A squeeze of lime sharpens it beautifully."], faq:[{q:"Dairy-free?",a:"Use coconut yoghurt and all coconut milk."}] },

"olive-oil-mashed-potato-massimo-bottura": { title:"Olive Oil Mashed Potato", category:"Snack", prepMin:5, cookMin:25, servings:4,
  description:"My Thermomix take on a Massimo Bottura-style olive oil mash — silky, dairy-free and full of flavour.",
  ingredients:["800 g potatoes, cubed","80 g good olive oil","60 g warm milk (or water)","1 garlic clove","Salt, pepper"],
  steps:["Steam the potatoes: 500 g water in the bowl, potatoes (and the garlic clove) in the Varoma, 25 min / Varoma / speed 1.","Empty the water. Return the potatoes and garlic to the bowl with the olive oil, milk, salt and pepper. Mix 20 sec / speed 4 until silky — don't over-mix or it turns gluey."],
  tips:["Olive oil instead of butter keeps it light and Italian.","Steaming (not boiling) keeps the potatoes from going watery."], faq:[{q:"Why not blend longer?",a:"Over-working potato makes it sticky — a short mix keeps it fluffy."}] },

"mushroom-barley-soup-marco-pierre-white": { title:"Mushroom & Barley Soup", category:"Lunch", prepMin:10, cookMin:35, servings:4,
  description:"My Thermomix take on a Marco Pierre White-style mushroom barley soup — deep, earthy and nourishing.",
  ingredients:["1 onion, halved","2 garlic cloves","300 g mushrooms","30 g butter","100 g pearl barley","800 g beef or vegetable stock","1 tsp thyme","Salt, pepper, parsley"],
  steps:["Chop onion, garlic and mushrooms 5 sec / speed 5. Add butter, sauté 5 min / 120°C / speed 1.","Add the barley, stock and thyme. Cook 30 min / 100°C / Reverse / speed 1, MC off, until the barley is tender.","Season and finish with parsley."],
  tips:["Browning the mushrooms well is where the depth comes from.","A splash of soy adds savoury richness."], faq:[{q:"Can I use another grain?",a:"Spelt or farro work; adjust the time to the packet."}] },

"mushroom-stroganoff-tom-kerridge": { title:"Mushroom Stroganoff", category:"Dinner", prepMin:10, cookMin:20, servings:4,
  description:"My Thermomix take on a Tom Kerridge-style mushroom stroganoff — creamy, savoury and meat-free.",
  ingredients:["1 onion, halved","2 garlic cloves","400 g mushrooms","30 g butter","1 tsp paprika","1 tbsp tomato paste","200 g stock","100 g sour cream","Salt, parsley"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add the mushrooms, chop 4 sec / speed 4. Add butter and paprika, sauté 6 min / 120°C / Reverse / speed 1.","Add tomato paste and stock. Cook 8 min / 100°C / Reverse / speed 1.","Stir through the sour cream, season and finish with parsley. Serve over pasta or rice."],
  tips:["Reverse blade keeps the mushrooms in pieces, not mush.","A dash of mustard sharpens the sauce."], faq:[{q:"Dairy-free?",a:"Use a plant-based cream and butter."}] },

"one-pot-tomato-orzo-jamie-oliver": { title:"One-Pot Tomato Orzo", category:"Dinner", prepMin:8, cookMin:18, servings:4,
  description:"My Thermomix take on a Jamie Oliver-style one-pot tomato orzo — creamy, cheesy and all in one bowl.",
  ingredients:["1 onion, halved","2 garlic cloves","30 g olive oil","300 g orzo","400 g passata","600 g stock","1 tsp oregano","Parmesan, basil"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil, sauté 3 min / 120°C / speed 1.","Add the orzo, passata, stock and oregano. Cook 14 min / 100°C / Reverse / speed 1, MC off, until the orzo is tender and creamy.","Stir through parmesan, season and finish with basil."],
  tips:["Stir at the end so the orzo doesn't stick — Reverse does most of it.","Add spinach in the last 3 minutes for greens."], faq:[{q:"Can I use risoni?",a:"Yes — risoni and orzo are the same thing."}] },

"peanut-noodle-salad-david-chang": { title:"Peanut Noodle Salad", category:"Lunch", prepMin:10, cookMin:5, servings:4,
  description:"My Thermomix take on a David Chang-style peanut noodle salad — nutty, punchy and cold-noodle good.",
  ingredients:["3 tbsp peanut butter","30 g soy sauce","20 g rice vinegar","1 tbsp honey","20 g ginger","1 garlic clove","40 g warm water","300 g noodles, cooked & cooled","Cucumber, peanuts, coriander"],
  steps:["Add ginger and garlic to the bowl, chop 3 sec / speed 7.","Add peanut butter, soy, vinegar, honey and warm water. Blend 20 sec / speed 5 to a smooth dressing.","Toss through the cooled noodles with cucumber, crushed peanuts and coriander."],
  tips:["Loosen the dressing with a little more water if thick.","Add shredded chicken to make it a meal."], faq:[{q:"Warm or cold?",a:"Best cold — it's a noodle salad."}] },

"pea-mint-risotto-nigel-slater": { title:"Pea & Mint Risotto", category:"Dinner", prepMin:8, cookMin:22, servings:4,
  description:"My Thermomix take on a Nigel Slater-style pea and mint risotto — fresh, green and creamy with no stirring.",
  ingredients:["1 onion, halved","30 g butter","320 g arborio rice","100 g white wine","800 g hot vegetable stock","250 g peas","Handful mint","60 g parmesan","Salt, pepper"],
  steps:["Chop onion 4 sec / speed 5. Add butter, sauté 3 min / 120°C / speed 1.","Add rice and wine, cook 2 min / 100°C / Reverse / speed 1. Add stock, cook 14 min / 100°C / Reverse / speed 1, MC off.","Add the peas and cook 3 min / 100°C / Reverse / speed 1. Stir through parmesan and chopped mint, season, rest 2 minutes."],
  tips:["Add the peas late so they stay bright and sweet.","Mint at the very end keeps it fresh."], faq:[{q:"Frozen peas?",a:"Perfect — no need to thaw."}] },

"pea-pesto-pasta-nigella-lawson": { title:"Pea Pesto Pasta", category:"Dinner", prepMin:5, cookMin:10, servings:4,
  description:"My Thermomix take on a Nigella-style pea pesto pasta — sweet, green and on the table in minutes.",
  ingredients:["250 g peas","40 g parmesan","30 g pine nuts","1 garlic clove","60 g olive oil","Handful basil & mint","Salt","300 g pasta, cooked"],
  steps:["Add parmesan, pine nuts and garlic to the bowl, mill 8 sec / speed 8.","Add the peas, herbs, olive oil and salt. Blend 20 sec / speed 6 to a chunky pesto.","Toss through the cooked pasta with a splash of pasta water."],
  tips:["A little pasta water makes it glossy and helps it coat.","Lovely cold as a pasta salad too."], faq:[{q:"Raw or cooked peas?",a:"Cooked (or thawed frozen) — blanch fresh peas 2 minutes first."}] },

"pepper-steak-sauce-gordon-ramsay": { title:"Peppercorn Sauce", category:"Snack", prepMin:5, cookMin:12, servings:4,
  description:"My Thermomix take on Gordon Ramsay's peppercorn sauce — glossy, peppery and perfect over steak.",
  ingredients:["1 shallot","20 g butter","1 tbsp crushed peppercorns","50 g brandy (or stock)","150 g beef stock","150 g cream","1 tsp Dijon mustard","Salt"],
  steps:["Chop the shallot 3 sec / speed 6. Add butter and peppercorns, sauté 3 min / 120°C / speed 1.","Add the brandy and stock, reduce 5 min / Varoma / speed 1, MC off.","Add cream and mustard, cook 3 min / 90°C / speed 2 until glossy. Season."],
  tips:["Crush the peppercorns coarsely for bite.","Spoon over steak, chicken or roast potatoes."], faq:[{q:"Without alcohol?",a:"Swap the brandy for extra stock and a splash of vinegar."}] },

"prawn-laksa-poh-ling-yeow": { title:"Prawn Laksa", category:"Dinner", prepMin:15, cookMin:22, servings:4,
  description:"My Thermomix take on a Poh-style prawn laksa — a fragrant coconut noodle soup from a homemade paste.",
  ingredients:["1 onion","3 garlic cloves","20 g ginger","2 chillies","20 g lemongrass","1 tsp turmeric","30 g oil","400 g coconut milk","500 g stock","1 tbsp fish sauce","400 g prawns","Rice noodles, sprouts, lime, coriander"],
  steps:["Add onion, garlic, ginger, chilli, lemongrass and turmeric. Blend 8 sec / speed 8 to a paste, scrape.","Add oil and fry the paste 5 min / 120°C / speed 1.","Add coconut milk, stock and fish sauce. Cook 12 min / 100°C / speed 1. Add the prawns, cook 5 min / 90°C / Reverse / speed 1. Serve over noodles with sprouts, lime and coriander."],
  tips:["Frying the paste is what builds the deep flavour.","Add tofu puffs for the authentic touch."], faq:[{q:"Shortcut?",a:"Use 3 tbsp shop laksa paste and skip step 1."}] },

"roasted-carrot-hummus-ottolenghi": { title:"Roasted Carrot Hummus", category:"Snack", prepMin:10, cookMin:20, servings:6,
  description:"My Thermomix take on an Ottolenghi-style roasted carrot hummus — sweet, smoky and a gorgeous orange.",
  ingredients:["400 g carrots, chopped","1 garlic clove","1 x 400 g tin chickpeas, drained","80 g tahini","60 g lemon juice","1 tsp cumin","40 g olive oil","Salt"],
  steps:["Steam the carrots: 500 g water in the bowl, carrots in the Varoma, 18 min / Varoma / speed 1 until very soft. Drain. Empty the bowl.","Add garlic, chop 3 sec / speed 7. Add the carrots, chickpeas, tahini, lemon, cumin, olive oil and salt.","Blend 1 min / speed 8, scraping, until silky. Loosen with a little water if thick."],
  tips:["Roasting the carrots first (200°C, 25 min) deepens the sweetness even more.","A pinch of smoked paprika on top is gorgeous."], faq:[{q:"Can I roast instead of steam?",a:"Yes — roast the carrots for a smokier, sweeter hummus."}] },

"ricotta-spinach-gnudi-antonio-carluccio": { title:"Ricotta & Spinach Gnudi", category:"Dinner", prepMin:20, cookMin:10, servings:4,
  description:"My Thermomix take on a Carluccio-style ricotta gnudi — pillowy spinach-ricotta dumplings in sage butter.",
  ingredients:["200 g spinach","250 g ricotta","1 egg","50 g parmesan","60 g flour, plus extra","Nutmeg, salt","For serving: 60 g butter, sage"],
  steps:["Steam the spinach: 400 g water in the bowl, spinach in the Varoma, 6 min / Varoma / speed 1. Squeeze dry and chop 3 sec / speed 5.","Add ricotta, egg, parmesan, flour, nutmeg and salt. Mix 15 sec / speed 4 to a soft dough. Chill 20 minutes.","Roll into small balls, dust with flour, and simmer in salted water 3–4 minutes until they float. Toss in melted sage butter. (Stovetop finish.)"],
  tips:["Squeeze the spinach really dry or the dough will be wet.","Don't overcook — they're done when they float."], faq:[{q:"Can I make them ahead?",a:"Shape and chill on a floured tray; cook just before serving."}] },

"saffron-tomato-rice-claudia-roden": { title:"Saffron Tomato Rice", category:"Dinner", prepMin:8, cookMin:20, servings:4,
  description:"My Thermomix take on a Claudia Roden-style saffron tomato rice — fragrant, golden and fluffy.",
  ingredients:["1 onion, halved","2 garlic cloves","30 g olive oil","1 pinch saffron","300 g basmati rice, rinsed","1 tbsp tomato paste","420 g stock","Salt, parsley"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil and saffron, sauté 3 min / 120°C / speed 1.","Add the rice and tomato paste, toast 2 min / 100°C / Reverse / speed 1. Add the stock.","Cook 14 min / 100°C / Reverse / speed 1. Rest 5 minutes with the lid on, then fluff and finish with parsley."],
  tips:["Bloom the saffron in a little warm stock first for more colour.","Rinsing the rice keeps the grains separate."], faq:[{q:"Brown rice?",a:"Use 480 g stock and cook 25 minutes."}] },

"sesame-cucumber-noodles-jose-andres": { title:"Sesame Cucumber Noodles", category:"Lunch", prepMin:10, cookMin:5, servings:4,
  description:"My Thermomix take on a smashed-cucumber sesame noodle — cool, garlicky and refreshing.",
  ingredients:["30 g tahini or sesame paste","30 g soy sauce","20 g rice vinegar","1 tsp sugar","1 garlic clove","20 g sesame oil","300 g noodles, cooked & cooled","1 cucumber, smashed","Sesame seeds, spring onion"],
  steps:["Add the garlic to the bowl, chop 3 sec / speed 7. Add tahini, soy, vinegar, sugar and sesame oil. Blend 15 sec / speed 5.","Toss the dressing through the cooled noodles and smashed cucumber. Finish with sesame and spring onion."],
  tips:["Smash the cucumber so it drinks up the dressing.","A little chilli oil makes it sing."], faq:[{q:"Warm noodles?",a:"This is best cold — rinse the noodles under cold water first."}] },

"spaghetti-puttanesca-anna-del-conte": { title:"Spaghetti Puttanesca", category:"Dinner", prepMin:8, cookMin:18, servings:4,
  description:"My Thermomix take on Anna Del Conte's puttanesca — a punchy tomato sauce with olives, capers and anchovy.",
  ingredients:["3 garlic cloves","3 anchovy fillets","1 tsp chilli flakes","30 g olive oil","700 g passata","60 g black olives","2 tbsp capers","Salt","300 g spaghetti, cooked","Parsley"],
  steps:["Chop garlic 3 sec / speed 6. Add anchovies, chilli and oil, sauté 3 min / 120°C / speed 1.","Add passata, olives and capers. Cook 14 min / 100°C / Reverse / speed 1, MC off.","Season, toss through the spaghetti with parsley."],
  tips:["The anchovy melts in — it's savoury depth, not fishiness.","Capers and olives are salty, so taste before adding salt."], faq:[{q:"Vegetarian?",a:"Skip the anchovy and add a splash of soy for umami."}] },

"spiced-plum-jam-matt-preston": { title:"Spiced Plum Jam", category:"Snack", prepMin:10, cookMin:30, servings:16,
  description:"My Thermomix take on a Matt Preston-style spiced plum jam — deep, glossy and gently spiced.",
  ingredients:["700 g plums, stoned & chopped","450 g sugar","Juice of 1 lemon","1 cinnamon stick","2 star anise"],
  steps:["Add the plums, sugar, lemon and spices to the bowl. Cook 5 min / 100°C / speed 1 to start.","Cook 25 min / Varoma / Reverse / speed 1, MC off, until thick and jammy (around 105°C).","Remove the spices, pour into warm sterilised jars and seal."],
  tips:["A squeeze of lemon helps the jam set.","Star anise and cinnamon make it grown-up — lovely with cheese."], faq:[{q:"How long does it keep?",a:"Sealed jars keep for months; refrigerate once opened."}] },

"sweetcorn-chowder-curtis-stone": { title:"Sweetcorn Chowder", category:"Lunch", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix take on a Curtis Stone-style sweetcorn chowder — creamy, sweet and comforting.",
  ingredients:["1 onion, halved","2 garlic cloves","30 g butter","1 potato, cubed","400 g sweetcorn kernels","600 g stock","100 g cream","Salt, pepper, chives"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add butter, sauté 3 min / 120°C / speed 1.","Add the potato, sweetcorn and stock. Cook 18 min / 100°C / speed 1.","Blend half (30 sec / speed 6) for a creamy-but-chunky chowder. Stir through cream, season, finish with chives."],
  tips:["Blending half keeps texture and body without flour.","Crisp bacon on top is a lovely touch."], faq:[{q:"Frozen corn?",a:"Works perfectly — no need to thaw."}] },

"tomato-basil-pasta-marcella-hazan": { title:"Tomato & Butter Pasta", category:"Dinner", prepMin:5, cookMin:30, servings:4,
  description:"My Thermomix take on Marcella Hazan's famous tomato-butter sauce — three ingredients, pure magic.",
  ingredients:["1 onion, peeled & halved","800 g whole peeled tomatoes (tin)","80 g butter","Salt","300 g spaghetti, cooked","Basil, parmesan"],
  steps:["Add the tomatoes, the halved onion and the butter to the bowl with a good pinch of salt.","Cook 28 min / 100°C / speed 1, MC off, until rich. Remove the onion halves and crush the tomatoes lightly (5 sec / speed 4).","Toss through the cooked spaghetti with basil and parmesan."],
  tips:["The onion flavours the sauce then comes out — Marcella's genius.","Don't rush the simmer; that's where the silkiness comes from."], faq:[{q:"Do I really remove the onion?",a:"Yes — it gives sweetness, then you lift it out. (Or keep it, your call.)"}] },

"tomato-bread-soup-ruth-rogers": { title:"Tomato & Bread Soup", category:"Lunch", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix take on a River Café-style pappa al pomodoro — rustic Tuscan tomato and bread soup.",
  ingredients:["1 onion, halved","3 garlic cloves","40 g olive oil","800 g ripe tomatoes (or tinned)","400 g stock","150 g stale bread, torn","Basil, salt, pepper"],
  steps:["Chop onion and garlic 4 sec / speed 5. Add oil, sauté 3 min / 120°C / speed 1.","Add the tomatoes and stock. Cook 16 min / 100°C / speed 1.","Add the torn bread and basil, mix 10 sec / Reverse / speed 2, and rest 5 minutes so the bread soaks up and thickens. Season, finish with good olive oil."],
  tips:["Stale bread is essential — it's the body of the soup.","Finish with your best olive oil, Tuscan-style."], faq:[{q:"Smooth or rustic?",a:"Traditionally rustic and thick — don't blend it smooth."}] },

"tomato-chilli-jam-maggie-beer": { title:"Tomato Chilli Jam", category:"Snack", prepMin:10, cookMin:35, servings:16,
  description:"My Thermomix take on a Maggie Beer-style tomato chilli jam — sweet, sticky and a little fiery.",
  ingredients:["700 g tomatoes, chopped","2 red chillies","2 garlic cloves","20 g ginger","300 g sugar","60 g red wine vinegar","1 tsp salt"],
  steps:["Add the chilli, garlic and ginger, chop 4 sec / speed 7. Add the tomatoes, sugar, vinegar and salt.","Cook 5 min / 100°C / speed 1 to start, then 30 min / Varoma / Reverse / speed 1, MC off, until thick and jammy.","Pour into warm sterilised jars and seal."],
  tips:["Adjust the chilli to taste — it mellows as it cooks.","Incredible with cheese, eggs or grilled meat."], faq:[{q:"How long does it keep?",a:"Sealed jars keep for months; refrigerate once opened."}] },

"vanilla-berry-compote-donna-hay": { title:"Vanilla Berry Compote", category:"Dessert", prepMin:5, cookMin:12, servings:8,
  description:"My Thermomix take on a Donna Hay-style berry compote — glossy vanilla berries for yoghurt, pancakes or cake.",
  ingredients:["400 g mixed berries (fresh or frozen)","60 g sugar","1 tsp vanilla paste","Juice of 1/2 lemon","1 tsp cornflour (optional)"],
  steps:["Add the berries, sugar, vanilla and lemon to the bowl. Cook 10 min / 90°C / Reverse / speed 1, MC off.","For a thicker compote, add the cornflour slaked in a little water and cook 2 min / 90°C / Reverse / speed 1. Cool — it thickens more."],
  tips:["Reverse blade keeps the berries whole and pretty.","Spoon over yoghurt, ice cream, pancakes or the Nigella chocolate cake."], faq:[{q:"Frozen berries?",a:"Perfect — no need to thaw."}] },

"tomato-galette-diana-henry": { title:"Tomato Galette", category:"Baking", prepMin:20, cookMin:30, servings:6,
  description:"My Thermomix take on a Diana Henry-style tomato galette — a free-form tart with a buttery pastry. The Thermomix makes the dough.",
  ingredients:["200 g plain flour","120 g cold butter, cubed","1 pinch salt","50 g cold water","60 g ricotta or goat's cheese","4 tomatoes, sliced","Thyme, olive oil"],
  steps:["Make the pastry: add flour, butter and salt, mix 8 sec / speed 6 to crumbs. Add the cold water, mix 10 sec / speed 5 to a dough. Wrap and chill 30 minutes.","Roll into a rough circle, spread the cheese, layer the tomatoes, fold the edges over.","Brush with olive oil, scatter thyme, and bake at 200°C for 30 minutes until golden. (Oven bake.)"],
  tips:["Keep the butter cold for a flaky pastry.","Salt the tomatoes and pat dry so the base stays crisp."], faq:[{q:"Can I make the pastry ahead?",a:"Yes — it keeps 2 days chilled or freezes well."}] },

"zucchini-fritters-stephanie-alexander": { title:"Zucchini Fritters", category:"Lunch", prepMin:10, cookMin:15, servings:4,
  description:"My Thermomix take on a Stephanie Alexander-style zucchini fritter — crisp outside, soft inside, with feta and herbs.",
  ingredients:["400 g zucchini, grated","100 g feta","2 eggs","80 g flour","2 spring onions","Mint & dill","Salt, pepper","Oil, for cooking"],
  steps:["Grate the zucchini 4 sec / speed 5, then squeeze out the liquid well. Chop the spring onions and herbs 3 sec / speed 5.","Return the zucchini to the bowl with the feta, eggs, flour, salt and pepper. Mix 8 sec / Reverse / speed 3 to a batter.","Cook spoonfuls in a hot oiled pan, 2–3 minutes each side, until golden. (Pan finish.)"],
  tips:["Squeezing the zucchini dry is the secret to crisp, not soggy, fritters.","Serve with yoghurt and lemon."], faq:[{q:"Can I bake them?",a:"Yes — 200°C for 18–20 minutes, turning once."}] },

"white-bean-minestrone-anna-del-conte": { title:"White Bean Minestrone", category:"Lunch", prepMin:10, cookMin:25, servings:4,
  description:"My Thermomix take on Anna Del Conte's minestrone — a hearty Italian vegetable and white bean soup.",
  ingredients:["1 onion, halved","2 garlic cloves","1 carrot","1 celery stick","30 g olive oil","400 g chopped tomatoes","1 x 400 g tin cannellini beans, drained","700 g stock","60 g small pasta","Parmesan, basil"],
  steps:["Chop onion, garlic, carrot and celery 5 sec / speed 5. Add oil, sauté 5 min / 120°C / speed 1.","Add the tomatoes, beans and stock. Cook 12 min / 100°C / Reverse / speed 1.","Add the pasta and cook 8 min / 100°C / Reverse / speed 1 until tender. Season, finish with parmesan and basil."],
  tips:["A parmesan rind simmered in adds beautiful depth.","Mash a few beans to thicken the broth."], faq:[{q:"Which pasta?",a:"Any small shape — ditalini, risoni or broken spaghetti."}] },

"caramelised-onion-tart-paul-hollywood": { title:"Caramelised Onion Tart", category:"Baking", prepMin:20, cookMin:35, servings:6,
  description:"My Thermomix take on a Paul Hollywood-style onion tart — sweet caramelised onions on buttery pastry.",
  ingredients:["200 g plain flour","120 g cold butter","1 pinch salt","50 g cold water","4 onions, sliced","30 g butter (for onions)","1 tsp thyme","60 g gruyère, grated"],
  steps:["Pastry: mix flour, cold butter and salt 8 sec / speed 6 to crumbs; add water, mix 10 sec / speed 5 to a dough. Chill 30 minutes.","Onions: chop 3 sec / speed 4. Add butter and thyme, cook 18 min / 120°C / Reverse / speed 1, MC off, until soft and golden.","Roll the pastry, spread the onions, scatter gruyère, and bake at 200°C for 30 minutes. (Oven bake.)"],
  tips:["Low and slow is the secret to sweet, jammy onions.","A splash of balsamic at the end deepens them."], faq:[{q:"Can I use shop pastry?",a:"Yes — but the Thermomix pastry is quick and far better."}] },
};

let done = 0, missing = [];
for (const [slug, fix] of Object.entries(R)) {
  const p = join(DATA, `${slug}.json`);
  if (!existsSync(p)) { missing.push(slug); continue; }
  const r = JSON.parse(readFileSync(p, "utf8"));
  Object.assign(r, { title: fix.title, description: fix.description, category: fix.category, prepMin: fix.prepMin, cookMin: fix.cookMin, servings: fix.servings, ingredients: fix.ingredients, steps: fix.steps, tips: fix.tips, faq: [...(fix.faq||[]), ...(r.faq||[]).filter(q=>/original .* recipe/i.test(q.q)).slice(0,1)] });
  writeFileSync(p, JSON.stringify(r, null, 2) + "\n");
  done++;
}
console.log(`Reescritas: ${done} | não encontradas: ${missing.length}${missing.length?" ("+missing.join(", ")+")":""}`);
