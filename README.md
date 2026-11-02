# Wardrobe

A personal web app that keeps a digital closet and builds colour-matched outfits for any occasion.
Everything runs in the browser and is saved to `localStorage`; there is no backend or account.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:5173. `npm run build` produces a static `dist/` folder you can host anywhere
(Railway static, Netlify, GitHub Pages) or simply open from disk.

## What it does

- **Closet** – add each piece with its type (t-shirt, chinos, blazer, loafers, belt…), colour (38-colour palette or any hex),
  pattern, formality (1–5), season weight and style tags. Defaults are filled from the type so most items are three clicks.
  Export / import as JSON from the ⋯ menu; "Load example closet" gives you a demo wardrobe.
- **Outfits** – pick an occasion (office, interview, date, wedding, beach, gym, travel…) and a season. The engine enumerates
  every top + bottom (or one-piece) + shoes + optional jacket, adds matching accessories (belt matched to leather shoes, tie for
  formal, scarf only with a jacket…) and scores each look. Every card explains why it works and what to watch out for.
- **What to buy** – shows how many good combinations your closet makes per occasion, then ranks staple pieces by how many
  *new* good combinations they would unlock, weighted toward the occasions you cover worst. Also flags missing finishing
  touches (a belt to match your brown shoes, a watch, a tie). "I bought it" drops the piece straight into your closet.

## How the colour matching works

`src/engine/color.ts` classifies any hex into white / black / grey / navy / denim / earth / olive / pastel / colour and scores
pairs with classic rules: neutrals go with everything, navy + camel and denim + earth tones get a bonus, black + brown and
black + navy are flagged, analogous and complementary hues score well, two saturated hues 60–150° apart clash.
`src/engine/outfit.ts` then combines colour harmony with formality fit, style tags, season, pattern count, mood of the occasion
(dark for evenings, light for brunch, muted for interviews) and shoe/belt rules into a 0–100 score.

## Project layout

```
src/
  data/        palette, clothing types, occasions, staple catalogue, example closet
  engine/      colour theory, outfit generator, shopping advisor
  components/  closet grid, item form, outfit cards, shop view
  hooks/       localStorage persistence
```

Tune the rules by editing the data files or the scoring blocks in `engine/outfit.ts`; nothing else needs to change.
