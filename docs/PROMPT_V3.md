# Portfolio v3 · "Title screen" — piano e prompt per Claude Code

Aggiornato: 28/10/2026. Mockup: canvas Claude Design "Portfolio · Title screen & modes" (6 tavole).

## Decisioni prese il 28/10 (sostituiscono quelle vecchie in conflitto)
| Tema | Decisione | Sostituisce |
|---|---|---|
| Progetti | 3 soli: Nipotyno, Levante, Sensor lab (esercizi Arduino/Teensy del corso Multisensory Interactive Systems). Housing e Lab tolti dal sito | 4 casi + Lab |
| Apertura | `/` = schermata titolo (nome, ruolo, date, menu, 3 card "Quick picks", CV, contatti). Mai un cancello: il contenuto è già lì | lobby "Select your player" |
| Modalità | **Story mode** (`/story/` → capitoli 1-2-3 in ordine), **Gameplay** (`/play/`, il gioco è la pagina intera), **Multiplayer** (`/multiplayer/`, sottotitolo sempre visibile "Contact & CV") | stadio dentro la home |
| Navigazione | Barra delle modalità uguale in tutte le pagine: "◀ Title screen" · Story mode · Gameplay · Multiplayer · EN/ES/IT · CV. Nel gioco: menu di pausa (Esc / ⏸) con Resume · Read this project · Switch to Story mode · Multiplayer · Title screen | — |
| Lingua | Resta in alto (EN · ES · IT), ricordata; nessuna schermata di scelta lingua | — |
| Stile | Notte (stile A) per titolo e gioco; carta (stile C) per Story, casi e Multiplayer | sfondo crema unico |
| Font | Jersey 10 (titoli, menu, numeri) + Atkinson Hyperlegible Next (testo) + Atkinson Hyperlegible Mono (etichette). Tutti SIL OFL, in CREDITS. Il font pixel 5×7 originale resta solo nell'arte del gioco | font di sistema; "niente Press Start 2P" resta valido |
| Testi | Riscritti da Claude Code con la checklist anti-AI (sotto) + skill humanizer; Riccardo rivede alla fine | — |
| Pixel art | Rampe di colore con ombre verso il blu e luci verso il giallo, contorni colorati, idle a 4 frame; stadio di notte per il titolo | — |

Ispirazioni (solo struttura, niente copia): Helas Pxl (capitoli numerati 01/02, carta, titoli grandi), Tuan Anh (avatar grande con personalità, "player profile", titolo spesso con ombra), Heo Bien (titolo sopra una scena viva, kit di bottoni coerente). Il terzo è fan art di una serie protetta: si prende solo l'impostazione.

## Ordine delle sessioni (una per volta, poi `/clear`)
0. **Setup strumenti** (5 min, lo fai tu)
1. **F1 Tre progetti**: togli Housing e Lab
2. **F2 Testi**: riscrittura naturale
3. **F3 Identità**: font + colori
4. **F4 Schermata titolo + modalità + barra**
5. **F5 Gameplay a pagina intera + menu di pausa**
6. **F6 Pixel art**
7. **F7 Caso Sensor lab** (quando mi dai foto e appunti degli esercizi)

Pubblica dopo F4 se ti serve subito il nuovo ingresso: F1–F4 insieme sono già una versione coerente.

---

## 0 · Setup strumenti (in Claude Code, una volta)
```
/plugin install frontend-design@claude-plugins-official
/plugin marketplace add blader/humanizer
/plugin install humanizer@humanizer
/reload-plugins
```
Poi, dal Terminale nella cartella PORTFOLIO (prima di aprire claude):
```
claude mcp add playwright npx '@playwright/mcp@latest'
```
- frontend-design: un design meno "standard".
- humanizer: toglie i segni di scrittura AI. Leggi il suo SKILL.md prima di usarlo.
- Playwright MCP: Claude apre il sito in un browser vero e fa gli screenshot da solo.

---

## F1 · Tre progetti
```
Leggi CLAUDE.md, docs/SPEC.md e docs/DECISIONS.md.

OBIETTIVO: il sito mostra solo 3 progetti: Nipotyno, Levante e un terzo, "Sensor lab", che per ora è un segnaposto. Housing e Lab escono dal sito.
PERCHÉ: chi assume guarda 2–3 casi e apre solo i primi; gli esercizi brevi abbassano il livello.

COSA CAMBIARE
- Togli dal sito housing e lab in EN, ES e IT: pagine generate, card della lista, punti dello stadio (3rd base e dugout), tour, PDF, anteprime OG, link "previous/next", test. I file content/housing.md, content/lab.md e le immagini in public/assets/housing|lab NON vanno cancellati: spostali in content/_archive/ e public/_archive/ (esclusi dalla build).
- Nuovo content/sensor-lab.md (+ es/, it/) con il frontmatter dei casi, base "3rd base", testo segnaposto marcato [CHECK] in cima: "Case study in preparation: Arduino and Teensy prototypes from the Multisensory Interactive Systems course (University of Trento)". Non inventare dati.
- Stadio: 3rd base = Sensor lab. Il dugout resta solo decorazione (non cliccabile). Bullpen invariato.
- Uniforme "Maker": caso suggerito = Sensor lab. "Researcher": suggerito = Nipotyno.
- Status/CONTENT_STATUS e facts.md: niente dati nuovi; solo la riga "Sensor lab: in preparation".
- Cosa NON toccare: grafica, testi di Nipotyno e Levante, layout.

TEST
- Aggiorna i test che contano 4 casi / 8 punti. Aggiungi un test: /housing/ e /lab/ non esistono nella build e nessun link li punta.
- Prove: npm run build, npm test, screenshot 1280 e 390 px della home e dello stadio, tastiera.

ALLA FINE
- docs/DECISIONS.md: "2026-10-28 — 3 progetti (Nipotyno, Levante, Sensor lab). Housing e Lab archiviati in content/_archive/."
- Commit, push solo se i test passano.
Rispondi in italiano semplice. Proponi prima il piano (plan mode).
```

## F2 · Testi naturali
```
Leggi CLAUDE.md, docs/DECISIONS.md e content/facts.md.

OBIETTIVO: riscrivere in inglese naturale i testi di content/about.md, content/nipotyno.md e content/levante.md (testo e frontmatter tldr/description), più le frasi dell'interfaccia in src/i18n.js (solo EN).
PERCHÉ: oggi suonano scritti da un'AI (trattini lunghi, gruppi di tre, frasi a effetto) e un recruiter UX lo nota.

COME
- Usa la skill humanizer se installata; in ogni caso applica TUTTA la checklist qui sotto.
- Prima mostrami una tabella "frase vecchia → frase nuova" per about.md, aspetta il mio ok, poi fai il resto.
- Ogni numero e fatto deve restare identico a content/facts.md. Non aggiungere fatti. Lunghezza simile o più corta (casi 600–850 parole).
- Le traduzioni ES/IT: aggiornale con le stesse frasi e lascia [CHECK] in cima.

CHECKLIST ANTI-AI
PAROLE da togliere: delve, tapestry, testament, pivotal, crucial, intricate, underscore, showcase, landscape, foster, enhance, robust, seamless, leverage, journey, realm, vibrant, "serves as", "stands as", "plays a vital role".
STRUTTURE: niente "not X, but Y" / "It's not X, it's Y"; niente gruppi di tre automatici; niente frasi finali a effetto o slogan; niente "-ing" finali che aggiungono analisi finta; niente "moreover/furthermore/additionally", niente riassunti finali; non iniziare frasi di fila allo stesso modo.
FORMATO: trattino lungo (—) al massimo uno per sezione, altrimenti virgola, due punti o parentesi; titoli in sentence case; niente "**Etichetta:** frase" negli elenchi; poco grassetto; virgolette dritte.
VOCE DA CASO UX: prima persona per quello che ho fatto io ("I ran 2 of the 6 sessions"), "we" solo per il lavoro di gruppo con chi ha fatto cosa; numeri concreti; cosa è andato storto e cosa ho cambiato; frasi corte (quasi sempre < 20 parole), forma attiva, un'idea per paragrafo; verbi concreti (sketched, tested, cut); chiudere con una cosa imparata, non con uno slogan.
TIENI il motto così com'è: "I don't know what you need — yet. But I can find out." (è di Riccardo).

TEST
- npm run build, npm test (i test che leggono id dei titoli devono passare), conta parole per caso, grep dei trattini lunghi e delle parole vietate (mostrami il risultato: 0 parole vietate).

ALLA FINE
- docs/DECISIONS.md: "2026-10-28 — Testi EN riscritti con checklist anti-AI; ES/IT [CHECK]".
- Commit. Rispondi in italiano semplice. Plan mode prima.
```

## F3 · Font e colori
```
Leggi CLAUDE.md, docs/DECISIONS.md, src/style.css e src/palette.js.

OBIETTIVO: nuova identità tipografica e due temi di colore: "night" (titolo e gioco) e "paper" (Story, casi, Multiplayer).
PERCHÉ: i font di sistema rendono il sito generico; le due atmosfere dicono "stadio di notte" e "programma della partita".

COSA CAMBIARE
- Font self-hosted con npm: @fontsource/jersey-10, @fontsource/atkinson-hyperlegible-next (400, 700, 400 italic), @fontsource/atkinson-hyperlegible-mono (400, 700). Importa SOLO i sottoinsiemi "latin" (coprono á é í ó ú à è ì ò ù ñ ü ¿ ¡). Preload di 2 file: Jersey 10 e Atkinson 400. font-display: swap. Fallback con size-adjust per evitare salti di layout.
- Uso: Jersey 10 solo per titoli, menu, bottoni grandi e numeri (mai testo lungo, mai codici o email: I/l/1 e O/0 si confondono). Dimensioni a multipli del pixel del font: --j: calc(1400px / 75) → 1×, 2×, 3×, 4×, 6× (in rem). Atkinson Next per il testo: 18 px, line-height 1.6, max 68ch. Atkinson Mono per etichette maiuscole piccole.
- Colori come variabili CSS in :root con due temi ([data-theme="night"], [data-theme="paper"]):
  night: bg #0b0f1e · panel #1b2a4a · line #2c4170 · ink #f4f1e6 · accent #f2c14e · accent2 #5fd3ff · red-text #ff6b5a · red-fill #b3261e · muted #9aa3b8
  paper: bg #f6f2ea · card #fffaf0 · card-dark #e8dcc4 · ink #1b2a4a · red #b3261e · green-text #2e6b34 · yellow (solo riempimenti) #f2c14e · muted #4a5468 · line #d9ccb3
  Il giallo su carta e il verde prato su carta NON vanno mai usati per il testo (contrasto 1.5 e 3.2).
- Cornici: bordo 2 px color inchiostro + ombra piena 4 px (box-shadow 4px 4px 0), niente angoli arrotondati, niente sfumature.
- Applica il tema paper alle pagine dei casi e il tema night allo stadio. Nessun cambio di struttura (quella è F4).
- docs/CREDITS.md: una riga per font ("Jersey 10 © The Soft Type Project Authors, SIL OFL 1.1", Atkinson Hyperlegible Next/Mono © Braille Institute, SIL OFL 1.1) + public/fonts/OFL.txt se serve.

TEST
- Test axe di contrasto su entrambi i temi; test che i 3 font si caricano (document.fonts.check) e che i titoli con accenti ES/IT non vanno a capo male a 390 px.
- Prove: build, test, screenshot 1280/390 di un caso e dello stadio, peso totale dei font (< 80 KB).

ALLA FINE
- docs/DECISIONS.md: "2026-10-28 — Font Jersey 10 + Atkinson Hyperlegible Next/Mono (OFL, crediti); temi night e paper. Il font 5×7 originale resta per l'arte del gioco."
- Commit. Italiano semplice. Plan mode prima.
```

## F4 · Schermata titolo, modalità e barra
```
Leggi CLAUDE.md, docs/SPEC.md, docs/DECISIONS.md. Guarda il mockup (te lo descrivo qui sotto; le immagini sono in docs/assets-preview/mockup-v3/ se le ho salvate).

OBIETTIVO: il sito si apre come un videogioco: `/` è una schermata titolo; da lì si sceglie Story mode, Gameplay o Multiplayer, e ogni modalità è una pagina intera (non una finestra dentro la home).
PERCHÉ: l'utente sceglie come visitare il portfolio, ma nome, ruolo, date, CV e i 3 progetti sono comunque visibili in 5 secondi.

QUESTO SOSTITUISCE (scrivilo in DECISIONS): la lobby "Select your player" come primo schermo e lo stadio dentro la home (Fase 2).

PAGINE
1. `/` — Title screen (tema night, pagina HTML vera, funziona senza JS):
   - Barra in alto: nome · EN·ES·IT · "CV ↓" (lingua della pagina) · "Contact" (→ /multiplayer/).
   - Logo "RICCARDO CIRILLO" in Jersey 10 grande con ombra rossa; sotto "UX Research & Design · internship in Madrid, Feb–Jul 2027" e una riga "EIT Digital MSc in HCI & Design · Italian, English, Spanish".
   - Menu (link veri <a>): ▶ STORY MODE "Read the 3 case studies, one after the other · 5 min" · GAMEPLAY "Swing, run the bases, open the projects · 2 min" · MULTIPLAYER "Contact & CV". Prima voce evidenziata. Cursore ▶ che segue hover/focus; frecce ↑↓ + Invio con JS (solo quando il focus è nel menu, niente keydown globale).
   - "Quick picks": 3 card (01 Nipotyno, 02 Levante, 03 Sensor lab) con titolo, una riga e i numeri chiave → pagina del caso.
   - Sfondo: cielo notturno con poche stelle e torri luci, stadio in basso scurito (F6 lo disegnerà meglio). Niente "PRESS START" che lampeggia più di 5 s (WCAG 2.2.2); con reduced motion niente animazioni.
   - Telefono 390 px: barra compatta, logo 2 righe, menu, poi card. Nome, ruolo, date, CV e la card Nipotyno entro 2 schermate.
2. `/story/` — capitolo 0 (tema paper): chi sono in 4 righe, motto, "How I design" in 3 punti corti, avanti → Chapter 1. Poi le pagine dei casi esistenti diventano i capitoli: /nipotyno/ (1 of 3) → /levante/ (2 of 3) → /sensor-lab/ (3 of 3) → fine: "That's the story" + link Multiplayer e "Play the game". Su ogni caso: barra di avanzamento "Chapter N of 3" e in fondo un grande "Next chapter ▶" + "◀ Title screen".
3. `/play/` — il gioco a pagina intera (fa F5; in questa sessione basta spostare lo stadio esistente qui e togliere dalla home lobby e stadio).
4. `/multiplayer/` — tema paper: titolo MULTIPLAYER, sottotitolo "Contact & CV. Looking for a teammate for February–July 2027?"; "biglietto" con email (testo vero, cliccabile) e 2 bottoni CV EN/ES; "Scouting report" con Position, Available, Status, Languages, Education presi da content/facts.md (niente dati nuovi; niente LinkedIn finché non c'è l'URL).

BARRA DELLE MODALITÀ (tutte le pagine tranne il titolo): "◀ Title screen" · Story mode · Gameplay · Multiplayer (quella attuale evidenziata, aria-current) · EN ES IT · CV. Su telefono va a capo, bersagli ≥ 44 px.

DA MANTENERE
- Pagine statiche con Open Graph, versioni /es/ e /it/ con le stesse rotte (/es/story/, /es/play/, /es/multiplayer/), hreflang, scelta lingua salvata.
- Vecchi link: /#nipotyno, /#levante → /nipotyno/ ecc. (piccolo script + link visibile senza JS). /#about → /story/. /#contact → /multiplayer/.
- Le stringhe nuove in src/i18n.js (EN definitivo, ES/IT [CHECK]).
- Il reader a schermo intero non serve più nella Story mode (sono pagine vere); resta nel gioco solo se semplice, altrimenti "Read this project" apre la pagina.

TEST
- Nuovi test Playwright: il titolo mostra nome/ruolo/date/CV/email/3 card a 1280 e 390; menu raggiungibile e usabile da tastiera; i 3 link portano alle 3 modalità; ogni pagina ha la barra e "◀ Title screen"; Story: catena 0→1→2→3→fine; senza JS tutto è navigabile; axe senza errori su tutte le pagine nuove; reduced motion senza animazioni.
- Prove: build, test, screenshot 1280 e 390 di /, /story/, /nipotyno/, /multiplayer/, /play/.

ALLA FINE
- DECISIONS.md (una riga per scelta), SPEC.md aggiornato (nuova sezione "v3 Title screen" in cima), commit, push.
Usa la skill frontend-design. Rispondi in italiano semplice. Plan mode: proponi il piano e aspetta il mio ok. È un cambio grande: dividilo in 2 commit (pagine + barra, poi menu da tastiera e redirect).
```

## F5 · Gameplay a pagina intera
```
Leggi CLAUDE.md, docs/DECISIONS.md, src/game.js, src/tour.js, src/spots.js.

OBIETTIVO: /play/ è il gioco a tutto schermo, semplice e con poco testo, con un menu di pausa che porta alle altre modalità.
PERCHÉ: chi sceglie Gameplay vuole giocare, non leggere; chi si stufa deve poter uscire in un clic.

COSA CAMBIARE
- Punti cliccabili: 1st Nipotyno, 2nd Levante, 3rd Sensor lab, home plate = Multiplayer (Contact & CV). Tabellone, monte e biglietteria tornano decorazioni (meno testo). Bullpen e dugout decorazioni.
- HUD in alto (una riga): "⏸ Pause · Esc" · base attuale · 3 rombi delle basi visitate · suono on/off.
- Avvio: scelta della divisa (Researcher / Designer / Maker) come primo passo del gioco, in una riga di 3 tessere piccole (si può saltare). Poi "Swing!" → home run → tour come oggi (Next base, mai automatico).
- Card della base: solo cover, titolo, 1 riga, numeri chiave, "Read the case study" (apre la pagina vera) e "Next base". Niente TL;DR lungo nel gioco.
- Menu di pausa (dialog modale, focus intrappolato, Esc chiude): RESUME · READ THIS PROJECT (il caso della base attuale) · SWITCH TO STORY MODE · MULTIPLAYER (Contact & CV) · TITLE SCREEN; sotto: lingua, suono, motion.
- Alla fine del tour: "Game over? Never." con 3 bottoni: Read the story · Multiplayer · Play again.
- Senza JS: /play/ mostra una frase e i link alle 3 pagine dei casi + Story mode.

TEST: Esc apre/chiude la pausa; Tab resta nel dialog; ogni voce porta dove deve; reduced motion: niente lancio/zoom; tastiera completa (frecce tra le basi); axe; screenshot 1280/390 con e senza pausa.
ALLA FINE: DECISIONS.md, SPEC.md, commit. Italiano semplice. Plan mode prima.
```

## F6 · Pixel art
```
Leggi CLAUDE.md, docs/DECISIONS.md, src/palette.js e scripts/art/*.js.

OBIETTIVO: personaggi meno rigidi e uno stadio di notte per la schermata titolo, sempre disegnati in codice e 100% originali.
PERCHÉ: oggi gli sprite hanno ombre piatte e contorni neri: sembrano fatti al computer, non disegnati.

COSA CAMBIARE
- Palette: aggiungi rampe da 5 toni per maglia rossa, navy, prato e pelle (ombra verso blu/viola, luce verso giallo, max 20° di spostamento per passo):
  rosso #5a1238 #8a1c16 #b3261e #e0533f #f5925a · navy #0f1a30 #1b2a4a #2c4170 #4a6aa0 #8fb0d8 · prato #1f5a4a #2f7d32 #3f9b3a #5db648 #a8d65a · pelle #5e3a3a #a8704f #d9a07a #eebd92 #f8dcb4. Aggiorna tests/art.spec.js.
- Contorno selettivo: il contorno di ogni parte è il tono più scuro della sua rampa (mai nero puro), più chiaro dal lato della luce (in alto a sinistra, per tutto).
- Batter: testa un po' più grande (stile "chibi" leggibile), posa asimmetrica; idle a 4 frame (respiro di 1 px, battito di ciglia ogni 8 frame); swing a 4 frame (carica, passo, contatto con scia, accompagnamento).
- Nuovo public/game/night.png: lo stesso stadio di notte (cielo #0b0f1e con dithering leggero, torri luci accese, tribune scure, prato con riflesso delle luci) per la schermata titolo. Stesse dimensioni e coordinate di field.png.
- Niente AI per generare immagini, niente sprite di altri giochi.

TEST: test palette; screenshot del foglio sprite prima/dopo affiancati (mostramelo); peso PNG; reduced motion = frame fermo.
ALLA FINE: DECISIONS.md, CREDITS.md se serve, commit. Italiano semplice. Plan mode prima.
```

## F7 · Caso Sensor lab (quando c'è il materiale)
Mi porti in chat: 3–6 foto o brevi video degli esercizi (senza volti), per ognuno 2 righe (cosa fa, sensori/attuatori, cosa hai imparato) e se è lavoro tuo o di gruppo. Io preparo `content/sensor-lab.md` (struttura del caso, 500–700 parole, niente dati inventati) e il prompt per Claude Code (immagini WebP senza EXIF, OG, PDF, traduzioni [CHECK]).

---

## Confermato da Riccardo (28/10)
- Terzo progetto: "Sensor lab".
- Story mode con capitolo 0 corto (chi sono, motto, 3 principi).
- Gameplay: la scelta della divisa resta, all'avvio del gioco, saltabile.

## Ancora aperto
- Multiplayer: LinkedIn da aggiungere quando c'è l'URL.
