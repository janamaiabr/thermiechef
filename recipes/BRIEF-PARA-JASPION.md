# Brief — ThermieChef: fotos das receitas + receitas novas (para o Jaspion)

Oi Jaspion! Você vai assumir **as fotos das receitas e a geração de receitas novas** do
ThermieChef (thermiechef.com.au), o site da Chef Aly. Este documento é tudo que você
precisa pra não errar. Leia junto com `recipes/HOW-TO-GENERATE-MORE.md` (o playbook
oficial do formato de receita).

---

## 1. O que é o ThermieChef (contexto)

Site da **Chef Aly**, consultora **independente** de Thermomix na Austrália. Cada receita
é uma **releitura (reimagining) de um prato icônico de um chef famoso**, refeita pro
**Thermomix (TM6/TM7)**. É **homenagem independente**, NÃO endossada pelo chef. O objetivo
do site é atrair gente que cozinha e, no fim, **vender Thermomix** (link de afiliada da Aly).

**Compliance (importante, vem dos contratos da Vorwerk):**
- Sempre "inspired by / releitura independente", método é da Aly, sem afiliação/endosso.
- **NUNCA** alegação de saúde, emagrecimento, detox, dieta. Nada político/religioso.
- Não inventar oferta/desconto de Thermomix (isso é só oficial).

---

## 2. Status atual das receitas

- **92 receitas** em `recipes/data/*.json` (uma por arquivo).
- O site publica por **fila com data**: `scripts/build.mjs` só publica receitas com
  `datePublished <= hoje`. As futuras ficam invisíveis na fila e entram uma por dia.
  Hoje há ~19 no ar; o resto está na fila.
- O **conteúdo (texto) das receitas já existentes está bom** e a Janaina quer **publicar
  todas** — mas **só depois das fotos certas**.
- O **problema atual: as fotos.** Hoje as receitas usam ~15 imagens genéricas
  compartilhadas (`dish-bowl.jpg`, `food-cake.jpg`, etc.). Resultado: **fotos repetidas
  e algumas erradas** (ex.: Beef Bourguignon aparecia com foto de frango). Isso não pode.

---

## 3. SUA TAREFA 1 — Refazer TODAS as fotos (uma única e correta por receita)

**Meta:** cada receita tem a **sua própria** foto, que **mostra o prato de verdade**, sem
repetir nenhuma entre receitas.

**Onde:** já deixei o repo pronto pra receber:
- Pasta das fotos: **`assets/recipes/`** (já existe).
- Lista exata do que gerar: **`recipes/PHOTO-MANIFEST.json`** (os 92 com slug, título,
  chef, prato, categoria e o caminho-alvo da imagem).
- Para cada receita, salve a foto em **`assets/recipes/<slug>.jpg`** e troque o campo
  `"image"` do JSON da receita para **`"recipes/<slug>.jpg"`**.
  (O template serve de `/assets/${image}`, então `recipes/<slug>.jpg` funciona direto.)

**Estilo das fotos (combine com o que já existe no site):**
- **Fotografia de comida realista e apetitosa**, qualidade de banco de imagem editorial.
- **Luz natural suave**, profundidade de campo rasa (fundo levemente desfocado).
- Prato/tigela de cerâmica bonita sobre madeira rústica ou linho; fundo neutro/quente.
- Vista de cima (flat lay) ou 45°. Bem servido, com guarnição. Tons quentes e convidativos.
- **Mostre SÓ o prato pronto, como ele realmente é.** Nada de texto, logo, mãos,
  máquina Thermomix nem embalagem.
- **Formato quadrado** preferível (as atuais são 800×800 / 800×~580). Pode usar ~1200px.
- A foto tem que **bater com o prato**: beef bourguignon = ensopado de carne no vinho
  (não frango!); hummus = hummus; bolo de chocolate = bolo de chocolate. Use o
  `title` + `dish` + `category` do manifesto pra acertar.

**Sugestão de prompt de geração (ajuste por receita):**
> Professional editorial food photography of "{title}" ({dish}, {cuisine} {category}).
> Natural soft daylight, shallow depth of field, on a beautiful ceramic plate/bowl on a
> rustic wood or linen surface, freshly served and garnished, appetising and realistic,
> overhead or 45-degree angle, warm inviting tones. Show ONLY the finished dish as it
> really looks. No text, no logos, no hands, no machine, no packaging. Square, high-res.

> Obs.: deixei um script de referência em `scripts/gen-recipe-photos.mjs` que faz isso
> via Gemini 2.5 Flash Image, lendo as receitas e salvando em `assets/recipes/`. Pode
> usar/adaptar, ou gerar do seu jeito — o que importa é o resultado (foto certa, única,
> no estilo, no caminho `assets/recipes/<slug>.jpg` + campo `image` atualizado).

**Quando terminar as fotos:** `node scripts/build.mjs`, confira em `/recipes`, depois
`git add -A && git commit && git push` (a Vercel publica sozinha). Aí podemos liberar a
fila inteira de receitas (todas com foto certa).

---

## 4. SUA TAREFA 2 — Como criar receitas NOVAS (going forward)

Siga o playbook **`recipes/HOW-TO-GENERATE-MORE.md`** à risca. Resumo do que não pode errar:

1. **Conceito:** releitura de um prato icônico de um **chef famoso**, pro Thermomix.
   Homenagem independente (sem endosso).
2. **NUNCA repetir um chef** já usado. A lista está no fim do playbook E em
   `recipes/data/*.json` (campo `inspiredBy.chef`). Sempre re-cheque os arquivos.
3. **Formato JSON exato** (um arquivo por receita em `recipes/data/<slug>.json`): veja o
   schema no playbook (slug, title, inspiredBy, description, image, category, cuisine,
   prepMin, cookMin, servings, keywords, thermomixModel, datePublished, intro,
   ingredients[], steps[], tips[], faq[]).
4. **Cada passo do método tem os ajustes inline**: `tempo / temperatura / velocidade`
   (ex.: `Sauté 3 min / 120°C / speed 1`). Use Varoma, Reverse, dough mode, MC, etc.
   Limites reais: máx 120°C (ou Varoma), velocidades 0–10. Se precisar de forno/fogão,
   diga honestamente só naquele passo.
5. **Sem alegação de saúde/dieta. Peso métrico (g/ml). Voz da Aly:** calorosa, simples,
   encorajadora. **SEO:** título buscável, descrição com o prato + "Thermomix", keywords,
   1–3 FAQ.
6. **Cada nova receita já nasce com a sua foto** em `assets/recipes/<slug>.jpg` e o campo
   `image: "recipes/<slug>.jpg"` (não usar mais as genéricas).
7. **Data da fila:** para um lote, dê a cada receita uma **data futura, uma por dia**,
   começando no dia seguinte à última receita da fila (`node scripts/queue-status.mjs --verbose`).

---

## 5. SUA TAREFA 3 — O cron de gerar uma receita nova por dia

Hoje existe `.github/workflows/daily-publish.yml`, mas ele só **publica** o que já está na
fila (roda `build.mjs`), e além disso **o GitHub Actions está travado por billing** (todos
os runs falham em 0s). A Janaina quer um cron que **gere uma receita nova de verdade todo dia**
(texto + foto), com chef inédito, e publique.

O que montar:
1. Um script `scripts/generate-daily.mjs` que: escolhe um chef/prato inédito, escreve o JSON
   da receita (seguindo o schema/regras acima), gera a foto em `assets/recipes/<slug>.jpg`,
   roda `build.mjs` e dá commit/push.
2. Um **agendador que realmente rode** (já que o GitHub Actions está bloqueado por billing).
   Opções: resolver o billing do GitHub, OU usar **Vercel Cron** (`vercel.json` com cron
   chamando uma rota `/api/cron-recipe`), OU um cron externo. **Confirme com a Janaina qual
   chave/serviço de imagem usar** (ela controla a `GOOGLE_AI_STUDIO_API_KEY` do Gemini).
3. Guardas: nunca repetir chef; validar com `scripts/validate-site.mjs` antes de publicar;
   alertar se a fila/gerador falhar.

---

## 6. Resumo do que está pronto pra você

- `recipes/PHOTO-MANIFEST.json` — a lista dos 92 que precisam de foto.
- `assets/recipes/` — a pasta onde as fotos vão.
- `scripts/gen-recipe-photos.mjs` — script de referência (Gemini) pra gerar as fotos.
- `recipes/HOW-TO-GENERATE-MORE.md` — o playbook do formato de receita.
- O placeholder de oferta na home **já foi corrigido** (não precisa mexer nisso).

Qualquer dúvida de regra, a fonte da verdade é o playbook + estes contratos da Vorwerk
(Consultant Advertising and Promotions Policy, Social Media and Website Policy).
