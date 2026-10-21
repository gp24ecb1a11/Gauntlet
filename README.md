# THE AETHERIAL GAUNTLET
### A playable landing page concept for Techfest 2026, IIT Bombay

A quest-style landing page for **techfest.org** — the 30th edition, themed
**"An Aetherial Renaissance"**. Instead of a hero image and a card grid, the visitor
enters a game: they pick a path, earn XP as they scroll, level up on real Techfest
facts, filter a quest board of 24 real competitions, and fill a purse with real
prize money.

Built for the **Techfest Campus Ambassador** programme.

---

## Why game-themed

Techfest's own 30th-edition identity is a palace, a character and floating islands under
an "Aetherial Renaissance" banner. A quest framing isn't a skin bolted onto a
corporate page — it matches the art direction Techfest already chose.

And the content maps onto game mechanics almost exactly:

| Techfest reality | Game mechanic |
|---|---|
| 24 competitions | Quest board, filtered by path, ranked by rarity |
| Prize pools (₹80,000 – ₹3,80,000) | Loot, added to your purse on accept |
| Zonal rounds in 12 cities | World map |
| Ignite Catalyst / Vanguard | Two guild factions |
| Workshop certificates | Skill scrolls in the Vault |
| Techfest trivia | Level-up facts |

**The game is the frame. The content is real.** Every competition name, prize pool,
workshop price and statistic on the page is taken from techfest.org or Techfest's
official channels — nothing is invented.

---

## What actually plays

- **Boot screen** — crest, title, PRESS START (or hit `Enter`)
- **HUD** — avatar, class, level badge, XP bar, gold purse, quest counter, sound toggle
- **XP from scrolling** — the whole page is the XP bar. 10,000 XP, ten levels
- **Level-up facts** — each level fires a toast with a genuine Techfest fact
- **Class select** — five paths; picking one filters the quest board instantly
- **Achievements** — eight unlock as you first reach each chapter
- **Quest board** — 24 real competitions, filterable, rarity-tiered, prize pools live
- **Accept a quest** — adds its real prize money to your purse; click again to open techfest.org
- **Minimap** — a rail of chapters that lights up as you pass through
- **Live countdown** — to 16 December 2026, 09:00 IST
- **Keyboard** — `1`–`5` choose a path, `↑`/`↓` jump between chapters
- **Sound** — procedural WebAudio blips, no audio files, toggleable
- **Restart** — resets purse, level and achievements

---

## No 3D assets

The brief forbade 3D assets, so everything is vector, CSS or 2D canvas:

- **Layered SVG scene** — a stylised palace with domes, minarets and lit arches, built
  from `<path>` elements, sitting between floating isles, two hill ranges, fog banks and
  foreground spires
- **Eight parallax layers** at speeds 0.10 → 0.86 — a measured **8.6× spread**
- **150 twinkling stars** generated at runtime
- **2D canvas particles** — drifting motes in gold, aether, violet and white that react
  to scroll velocity
- **Everything else** is CSS: gilded gradients, ornamental borders, glow, transitions

---

## Tech

- Vanilla HTML, CSS and JavaScript. **Zero dependencies, zero build step.**
- One SVG scene, one 2D canvas, one stylesheet, one script
- Google Fonts: Cinzel (display), Space Grotesk (body — Techfest's own site font),
  JetBrains Mono (HUD)

### Running it

No server required — just open `index.html`.

```bash
cd techfest-gauntlet
python -m http.server 8000   # optional
```

---

## Verified

Tested in a real browser, not just eyeballed:

- **0 runtime errors** across boot, scroll, class select, filtering and quest accept
- All **24 quests** render; filtering returns correct counts (AI & CODE → 7, ROBOTICS → 5)
- XP curve confirmed: 15% scroll → LV2, 50% → LV5, 100% → LV10
- Purse updates correctly: accepting *The Wrecking Ball Challenge* adds **₹3,50,000**
- Total prize pool auto-computed from the cards: **₹17,90,000**
- All 8 parallax layers move at exactly their configured speed ratio
- Countdown verified against 16 Dec 2026 (reads 55 days at time of build)
- Text contrast measured after adding scrims: copy regions average ~(24,21,29) against
  light text at (232,227,245)

---

## Sources

| Content | Source |
|---|---|
| 30th Edition, theme "An Aetherial Renaissance" | techfest.org meta tags |
| 24 competition names, descriptions, prize pools | techfest.org/competitions |
| Workshop titles, prices, combos, perks | techfest.org/workshops |
| Ignite Catalyst & Vanguard tracks | techfest.org/ignite |
| 1,75,000+ footfall, 2,500+ Indian / 500+ international colleges, 300+ events | Techfest / IIT Bombay Gymkhana official listings |
| 2.8M Facebook followers | Techfest LinkedIn |
| Past speakers (Kalam, Wales, Sen, Sharma) | IIT Bombay Gymkhana, Techfest archives |
| Dates 16–18 December 2026, accommodation from 15 Dec | techfest.org competition schedule & accommodation page |

---

## A note on scope

This is an **unofficial concept page** built for the Campus Ambassador programme, not a
replacement for techfest.org. A real production version would need to serve the site's
live data, match their design system exactly, and meet accessibility and performance
budgets. The footer states this on the page itself.

---

## File structure

```
techfest-gauntlet/
├── index.html      # SVG scene, 8 chapters, HUD, minimap, toasts
├── css/style.css   # Gilded renaissance theme + all animation
├── js/main.js      # XP, levels, classes, quests, achievements, particles, audio
└── README.md
```
