# SPEC — Riccardo's portfolio (v0.2, 2026-10-20)

> **v0.2 — Team meeting decisions (see MEETING_2026-10-20.md) OVERRIDE anything below that conflicts:**
> - Stack: Vite + HTML/CSS/SVG + plain JS (no Phaser). The site works without the game.
> - Home = first viewport already shows name, "UX Research & Design intern · Madrid · Feb–Jul 2027", CV EN/ES, contacts, Nipotyno card. No gate before content.
> - Every case = real static page with Open Graph (`/nipotyno/`, `/levante/`, `/housing/`, `/lab/`). `/nipotyno/` for consultancies/corporates; home for studios/startups.
> - Diamond = pixel PNG 320×180 at integer scale, bases = HTML links on the same grid; < 700 px → the same field at 1× with simplified touch labels (the list of cases stays below). The field is shown in every version.
> - **UPDATE (Riccardo): the COMPLETE portfolio is built in ~2 days** — uniforms, batting, home-run tour and all case studies included (see ROADMAP). No phased release.
> - Interaction: home-run tour that stops at each base = main; batting = optional extra that never decides content.
> - Baseball only in graphics and labels with plain translation ("1st base · Nipotyno"); never in case-study text.
> - Case template: TL;DR (50 words) → My role → Problem → Research → Ideas → Prototype → Test → Result → What I'd change. 700–900 words, 6–8 images.

Draft prepared in the "Internship" project. Open points are marked **[OPEN]**: interview Riccardo about them before building.

## 1. Goal and audience
- **Goal:** get a UX / user research internship in Madrid (Feb–Jul 2027) combined with the master's thesis.
- **Audience:** recruiters and UX leads. They spend a few minutes, skim, and want to see **process, role and results** (NN/g; UX Design Institute: 2–3 strong case studies, simple navigation, no gimmicks that block content).
- **Tension to solve:** a playful, memorable game AND fast access to the content. The game is the wrapper, the case studies are the product.

## 2. Style
- Retro **pixel art baseball**, 16-bit arcade feel, old Super Mario vibe (style only — all characters and art are original).
- Low resolution scaled up (e.g. 320×180 → full screen, pixel-perfect), limited palette, chunky pixel font for titles only; body text in a readable web font.
- References: Retro Pixel Baseball (Ponywolf) — https://ponywolf.com/retro-pixel-baseball ; pixel baseball characters on Magnific/Freepik (moodboard only, check license before any use).
- Light: should run smoothly on an old laptop and a phone.

## 3. Scenes
### 3.1 Start — "At bat" (home plate)
- **Left:** Riccardo's pixel character as the batter, big, in the foreground. Choose a **uniform** (Researcher / Designer / Maker); each uniform highlights a skill set. **Decided (B5):** the uniform changes the look (palette swap + accessory: lens / yellow pencil / wrench), the skills shown and a suggested case — never the order of the cases.
- **Right:** "How I design" panel: 3-line intro, 3 design principles, moodboard (palette, type, references), download CV (EN / ES), contacts.
- Buttons: **Play ball!** → field. **Skip → Case studies** (list view), always visible.

### 3.2 Field — the diamond
| Spot | Content |
|---|---|
| Home plate | Start / "Home run": contacts + CV |
| 1st base | **Nipotyno** (main case) |
| 2nd base | **Levante** |
| 3rd base | **Student housing research** |
| Dugout | **Lab** (short works) |
| (Dec) Bullpen / scoreboard | Multisensory — later |

Running the bases = the design process. Arriving on a base opens that case study.

### 3.3 Case study (on a base)
- HTML panel over the game, pixel frame, normal readable text, scrollable.
- Same structure for every case ("innings"): **Problem → Research → Ideas → Prototype → Test → Result → My role / team**.
- "Back to the field" returns to the same base. Deep link per case (`#nipotyno`, `#levante`, `#housing`, `#lab`).

## 4. Interaction — how you move between bases **[OPEN: choose in interview]**
Riccardo's ideas:
- **A. Bat to move:** each move is a swing. Power/timing (how long you hold the button, or when you release) decides where the ball goes and so which base you reach (single → 1st, double → 2nd, triple → 3rd, home run → home).
- **B. Home-run tour:** one swing at the start → home run → the character runs the bases and at each base the case study opens. Controls: **pause / play, back, next**, plus a base indicator to jump. It must NOT feel like a video: the user is always in control.
- **C. In order with a mini-action per base:** e.g. a slide into the base, a catch, to "unlock" each case.

Suggested combination (to discuss):
- First visit: one swing with a timing bar — you cannot fail (any hit becomes a home run) → **tour mode (B)** with pause/back/next. Good for recruiters: guided, linear story.
- After the tour or anytime: **free mode** — click/tap a base or use arrows; the batting mini-game (A) stays as an optional extra ("take another swing").
- Fallbacks always present: Skip/list view, deep links, keyboard, touch.

## 5. Content (sources on Riccardo's Mac)
All case-study text goes in `content/<case>.md` (prepared in the Internship project, then copied here). Images go in `public/assets/<case>/` (compressed).

| Case | Sources (Mac) | To create |
|---|---|---|
| Nipotyno (UPM HCI Project, team of 4 + business plan) | `~/Desktop/INFO INTERSHIP/II SEMESTRE/HCI Project/` (HIGH FIDELITY PROTOTYPE/SCREEN: 20 screens; NavigatioMap.png; screen_layout_options.pdf; lo-fi and hi-fi reports, SUS 78.75, UEQ Good/Excellent); `.../II SEMESTRE/Entrepreneurship and business modelling/FIRST PART/` | Device mockups, process diagram |
| Levante (EIT Digital Summer School 2026, team of 6) | `~/Desktop/EIT/SUMMER SCHOOL/PROJECT/` (personas, user journeys, dashboard overview.png, Dashboard.mov, device concepts, BMC, final slides) | Process diagram; Riccardo designed the dashboard |
| Student housing research (UPM HCI Intro + Ethics, team of 6) | `~/Desktop/INFO INTERSHIP/I SEMESTRE/HCI-Introduction and Design Methods/` (final report, wireflow, layout scheme, contextual inquiry, coding) | Screens from wireflow, findings summary |
| Lab | Heuristic evaluation (individual) `.../II SEMESTRE/Evaluation of Interactive System/Individual Evaluation/Final Report/`; Discord iOS UX analysis, type study, colour observation, sketches (`.../I SEMESTRE/User Experience and Mobile Interaction/`); A/B test | One card each: image + 2 lines |

Never publish: interview audio/transcripts, participant names, personal documents.

## 6. Tech (decided, see v0.2 box)
- Vite + HTML/CSS/SVG, plain JS; Markdown → HTML for content; GitHub Pages via GitHub Actions; Playwright + axe.
- Pixel art: Piskel or Aseprite; CC0 packs (e.g. Kenney) only if they fit; credits in `docs/CREDITS.md`.

## 7. Definition of done for the first shareable version (M2)
- Public link works on desktop and phone.
- Field with 4 spots, movement works, Nipotyno case complete and readable.
- Skip/list view + deep link `#nipotyno` work.
- Loads fast; no console errors.

## 8. Style choices by Riccardo (20/10/2026)
- **Character:** Riccardo himself as the batter, drawn from a reference photo in `docs/reference/` (the photo is ONLY a reference: never copy it into `public/`, never publish it).
- **Mood:** day game — blue sky, green grass, light and readable colours.
- **Main colours:** navy blue + red (uniform and whole UI), on a light background; all text pairs checked ≥ 4.5:1.
- **Sound:** yes (bat crack, crowd), behind an audio toggle, OFF by default.
- **Motto (Riccardo's):** "I don't know what you need — yet. But I can find out." Shown big on the Start screen and in the About. Tone: friendly and direct.
- **Positioning:** UX Research & Design. Target: tech/digital product companies, design studios, consultancies. Differentiators: international, technical (front-end + Arduino), business & innovation.
