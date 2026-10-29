# Credits

## Pixel art (public/game/)
All original, drawn in code by `npm run art` (scripts/art/) for this portfolio: no third-party sprites or packs (the web fonts are listed below).
- Field, crowd, dugout, base icons: original.
- Player sprite: original, inspired by Riccardo's look (navy uniform, helmet, curly hair). The reference photos in `docs/reference/` are private and never published or copied.
- Coaches, teammates and pitcher (crew.png): original, same body as the player with a cap.
- Lab cover (public/assets/lab/cover.webp): original chalkboard-in-the-dugout scene drawn in code (scripts/art/lab-cover.js).
- Lobby (Fase 2, removed in F6 with the lobby itself): original clubhouse, drawn in code.
- Night ballpark (public/game/night.png, F6): the same field at night, lit light towers, drawn in code (scripts/art/field.js).
- F6: player redrawn in code with a bigger head, 4-frame idle with blink, 4-frame swing; colour ramps and selective outlines (src/palette.js, scripts/art/canvas.js). No AI image generation, no sprites from other games.
- Icons for the scoreboard, the pitcher's mound and the ticket (Fase 2): original, in scripts/art/icons.js.
- Pixel title font (5×7, A–Z, 0–9 and a few signs): original, in scripts/art/title.js.
- Palette: 34 colours in src/palette.js (16 + 8 added for the 480×270 art + 10 in F6: the ends of the red, navy, grass and skin ramps, and the night sky).
- Fase 1 (480×270): field, 48 px player and crew, 24 px icons, scoreboard, ticket booth, mound, dugout and bullpen redrawn in code (scripts/art/*.js), all original.

## Fonts (F3, self-hosted from npm @fontsource, latin subset; licence text published at /fonts/OFL.txt)
- Jersey 10 © The Soft Type Project Authors, SIL OFL 1.1. Titles, menus, numbers.
- Atkinson Hyperlegible Next © Braille Institute of America (The Atkinson Hyperlegible Next Project Authors), SIL OFL 1.1. Reading text.
- Atkinson Hyperlegible Mono © Braille Institute of America (The Atkinson Hyperlegible Mono Project Authors), SIL OFL 1.1. Small labels.
- The original 5×7 pixel font (scripts/art/title.js) stays only inside the game art.

## Sound effects (src/sound.js)
All original, synthesised in the browser with Web Audio (bat crack, crowd, clap): no recordings or sample packs. Off by default.

## Case-study images (public/assets/)
From Riccardo's own projects; group work credits the whole team on each case page. Levante persona portraits are AI-generated (labelled on the page).

## Code libraries
- Vite (MIT), marked (MIT), sharp (Apache-2.0), Playwright (Apache-2.0), axe-core (MPL-2.0).
