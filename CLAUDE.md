# Riccardo's portfolio — baseball pixel game

Interactive UX/HCI portfolio of Riccardo Cirillo (EIT Digital MSc, Human-Computer Interaction and Design).
Goal: get a UX internship in Madrid (Feb–Jul 2027). The site is sent to recruiters with ONE fixed link.

## Read first
- @docs/SPEC.md — concept, scenes, interaction, rules (source of truth)
- @docs/ROADMAP.md — milestones + Definition of Done; work on ONE milestone per session
- docs/DECISIONS.md — log of decisions (append one line per decision)
- docs/MEETING_2026-10-20.md — why the decisions were taken (read when in doubt)
- docs/CONTENT_STATUS.md — all content is READY in content/ and public/ (do not rewrite it; render it). Lines with [CHECK] must be confirmed by Riccardo.
- New ideas go to docs/BACKLOG.md, not into the current session.

## Stack (decided 2026-10-20)
- Vite + HTML/CSS/SVG + plain JavaScript. NO Phaser, no framework, no TypeScript.
- Repo `<username>.github.io` on GitHub Pages, deployed by GitHub Actions.
- Playwright smoke test + axe accessibility check; images converted to WebP without EXIF (sharp script).
- Commands (after M0): `npm run dev` (local), `npm run build` (production), `npm test` (Playwright + axe)

## Rules
- IMPORTANT: the site must work completely WITHOUT the game. The game is an optional layer. Case-study text lives in `content/*.md` and is rendered as real HTML pages (e.g. `/nipotyno/` with Open Graph), never inside a canvas or image.
- Every case study must be reachable in < 10 seconds without playing ("Skip" / list view) and has its own deep link (e.g. `#nipotyno`).
- All art is original pixel art. Never use Nintendo/Mario or other copyrighted characters or sprites. Third-party assets only if CC0 or properly credited in `docs/CREDITS.md`.
- IMPORTANT: `docs/reference/` (Riccardo's personal photos) and `docs/assets-preview/` are in .gitignore: never commit, copy or publish them. The GitHub repo is public.
- Never publish research participants' data (audio, transcripts, names). Group work always credits the team.
- Keep it light: low-res pixel art scaled up, compressed images, respect `prefers-reduced-motion`.
- A milestone is done only when the Definition of Done in docs/ROADMAP.md passes (build, Playwright + axe, screenshots 1280/390 px, keyboard, contrast, reduced motion, online, commit). Show the evidence.

## Working with Riccardo
- He is new to Claude Code. Reply in Italian, short, simple words; explain technical terms in one line.
- Before multi-file changes, propose a plan (plan mode) and wait for approval.
- Site content and UI are in English.
