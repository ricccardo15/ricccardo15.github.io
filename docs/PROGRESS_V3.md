# Progress v3 (F3 → F6)

Diario delle fasi eseguite da Claude Code in autonomia sul ramo `v3` (29/10/2026). F7 saltata: il materiale di Sensor lab non c'è ancora.

## F3 · Font e colori — piano
- Font self-hosted con npm (@fontsource): Jersey 10, Atkinson Hyperlegible Next (400, 700, 400 italic), Atkinson Hyperlegible Mono (400, 700), solo il sottoinsieme "latin".
- Preload di Jersey 10 e Atkinson 400; font-display swap; fallback con size-adjust.
- Variabili CSS in :root con due temi: `[data-theme="night"]` (stadio/home per ora) e `[data-theme="paper"]` (casi).
- Cornici: bordo 2 px inchiostro + ombra piena 4 px, niente angoli arrotondati, niente sfumature.
- Jersey 10 solo per titoli, menu, bottoni grandi e numeri; Atkinson Next per il testo (18 px / 1.6 / 68ch); Mono per le etichette.
- Correzione Nipotyno (EN/ES/IT + facts.md): "6/6" e "100% task success" → "6/6 completed both tasks, one with help from the facilitator".
- CREDITS.md + OFL; test: contrasto axe nei due temi, font caricati, titoli ES/IT a 390 px, peso font < 80 KB.

## F3 · Font e colori — fatto
- Font: Jersey 10, Atkinson Hyperlegible Next (400/700/400 italic), Atkinson Hyperlegible Mono (400/700), copiati da npm in /fonts/ a ogni build; 6 file = 71 KB (< 80 KB); preload di Jersey e Atkinson 400; OFL pubblicata in /fonts/OFL.txt.
- Temi: variabili in :root, `[data-theme="paper"]` (casi, home per ora) e `[data-theme="night"]` (stadio, header, footer). Cornici quadrate, bordo 2 px + ombra piena.
- Nipotyno: "6/6 … one with help from the facilitator" in EN/ES/IT (description, tldr, TL;DR, tabella) e in content/facts.md.
- Prove: `npm test` = tutta la suite verde dopo 2 correzioni di contrasto (etichette delle basi selezionate, bottone Swing). Nuovo tests/f3.spec.js: 3 font caricati (document.fonts.check), peso < 80 KB, Jersey solo nei titoli, contrasto axe nei 2 temi, angoli quadrati, titoli ES/IT a 390 px senza uscire dal box.
- Screenshot: tests/screenshots/v3/f3-*.png (1280 e 390).
- Decisioni (auto): copia dei font in public/fonts/; fallback Arial con size-adjust misurato; header/footer sempre night; bottone principale rosso pieno.
- Punti aperti: la home ha ancora la lobby (diventa la schermata titolo in F4); il nome nella fascia dei casi è ancora l'SVG pixel 5×7 (in F4 diventa Jersey 10).

## F4 · Schermata titolo, modalità e barra — piano
- `/` diventa la schermata titolo (night): barra, logo, ruolo, menu a 3 voci con cursore ▶ e frecce, Quick picks.
- Nuove pagine: /story/ (capitolo 0), /play/ (lo stadio spostato qui), /multiplayer/ (biglietto + scouting report), in EN/ES/IT.
- I casi diventano capitoli (progresso "Chapter N of 3", scheda del giocatore, numeri chiave, "Next chapter ▶"); il capitolo 3 chiude la storia.
- Barra delle modalità su tutte le pagine tranne il titolo; vecchi link /#… reindirizzati.
- Stringhe nuove in src/i18n.js (EN definitivo, ES/IT [CHECK]); test nuovi in tests/f4.spec.js, test vecchi aggiornati dove la struttura è cambiata.

## F4 — fatto
- Pagine: /, /story/, /play/, /multiplayer/ + i 3 capitoli, ×3 lingue (21 pagine). Lobby, lista "Case studies", About e Contact della vecchia home tolti; src/reader.js tolto.
- Prove: `npm test` = 326 test verdi. Nuovo tests/f4.spec.js (titolo a 1280/390, menu e tastiera, barra su ogni pagina con target ≥ 44 px, catena Story 0→1→2→3→fine, Multiplayer, vecchi link, senza JS, OG delle pagine nuove, reduced motion). Test vecchi spostati su /play/ dove serviva; tolti solo quelli della lobby e del reader (comportamento tolto dal piano).
- Correzioni dopo gli screenshot: spazi nei link della barra, stadio del titolo tagliato in basso, barra compatta su telefono, email del biglietto che andava a capo, "2027" del biglietto che sbordava a 390 px, nome dei link del menu senza "▶".
- Screenshot: tests/screenshots/v3/f4-*.png.
- Decisioni (auto): vedi DECISIONS.md (reader tolto, fine storia nel capitolo 3, capitolo 0 dai testi di about.md, niente testi del mockup non presenti nel piano, nomi delle modalità in ES/IT, cursore CSS, sfondo provvisorio, un solo commit).
- Punti aperti: sfondo night.png (F6); /play/ a tutto schermo, HUD, pausa e divise (F5); ES/IT delle stringhe nuove [CHECK].

## F5 · Gameplay a pagina intera — piano
- /play/ diventa il gioco a tutta pagina: HUD in alto (⏸ Pause · Esc, base attuale, 3 rombi, suono) al posto della barra.
- Primo passo: scelta divisa (3 tessere, Skip). Poi Swing → home run → tour con Next base.
- Punti: 3 basi + casa base = Multiplayer; tabellone, monte e biglietteria diventano decorazione.
- Card corte (cover, titolo, 1 riga, numeri, Read the case study). Fine: "Game over? Never." con 3 bottoni.
- Menu di pausa modale con 5 voci + lingua, suono, movimento. Senza JS: una frase con i link.
- Test nuovi in tests/f5.spec.js; test vecchi aggiornati (Esc ora apre la pausa, prima la divisa, HUD al posto del contatore).

## F5 — fatto
- Codice: src/game.js riscritto (modi pick/bat/tour/free, HUD, pausa, divise, movimento ridotto a scelta), src/tour.js senza il riquadro nel campo, scripts/pages.js con la nuova pagina /play/, CSS di HUD, riga divise, pausa.
- Prove: `npm test` = 333 test verdi. tests/f5.spec.js: HUD in una riga, Esc apre/chiude con il focus giusto, Tab resta nella pausa (avanti e indietro), ogni voce porta dove deve, lingua che tiene la base, suono e movimento ricordati, divisa ricordata, partita intera da tastiera (frecce tra le basi), axe con pausa aperta, reduced motion senza lancio né zoom, screenshot con e senza pausa a 1280 e 390.
- Correzioni dopo gli screenshot: la scelta divisa copriva le basi (spostata sotto il campo), HUD su telefono su 3 righe (ora 2), spazi in "Sound: off".
- Screenshot: tests/screenshots/v3/f5-play-1280.png, f5-play-390.png, f5-play-tour-*.png, f5-play-pause-1280.png, f5-play-pause-390.png.
- Decisioni (auto): HUD al posto della barra con JS; Esc = pausa; divise sotto il campo e nessun focus automatico; "Read this project" nascosto prima del primo progetto; interruttore movimento; card corte; file tolti.
- Punti aperti: ES/IT delle stringhe nuove [CHECK] ("¿Game over? Nunca.", "Game over? Mai.").

## F6 · Pixel art — piano
- Palette: rampe da 5 toni per rosso, navy, prato e pelle (+ il blu notte #0b0f1e per il cielo di night.png); test della palette aggiornato.
- Contorno selettivo: ogni parte ha il contorno del tono più scuro della sua rampa (mai nero), più chiaro verso la luce (in alto a sinistra).
- Battitore: testa più grande (chibi), posa asimmetrica, idle a 4 frame con respiro di 1 px e battito di ciglia ogni 8 frame, swing a 4 frame (carica, passo, contatto con scia, accompagnamento).
- Nuovo public/game/night.png (480×270, stesse coordinate di field.png) per la schermata titolo: cielo con dithering, torri luci accese, tribune scure, prato con il riflesso delle luci.
- Tutto disegnato in codice (scripts/art/), niente AI e niente sprite di altri giochi. La vecchia lobby.png (non più usata dopo F4) esce dalla pipeline.

## F6 — fatto
- Palette: 34 colori, 4 rampe (src/palette.js, RAMPS). Contorno selettivo in scripts/art/canvas.js (outlineByRamp) usato da battitore e crew.
- Battitore: testa ×1.2, posa asimmetrica (mano sul fianco, ginocchio avanti), idle 4 frame con respiro di 1 px + frame di battito di ciglia (CSS: ciclo di 8 frame), swing in 4 frame (carica, passo, contatto con scia, accompagnamento).
- night.png 480×270 (stesse coordinate di field.png): cielo #0b0f1e con dithering e stelle, due torri luci accese, tribune e prato più scuri, infield illuminato a scacchi. Usata dalla schermata titolo.
- Prove: `npm test` = 337 test verdi. tests/art.spec.js: 34 colori, rampe in ordine e con i valori del piano, bordo dello sprite con ≥ 6 toni (niente contorno unico), runner.json a 18 frame, night.png, peso PNG. Reduced motion = frame fermo (test di smoke e F4/F5).
- Peso PNG: runner 12,4 KB · crew 7,6 KB · field 19,8 KB · night 21,9 KB · icons 1,0 KB.
- Confronto prima/dopo del foglio sprite: tests/screenshots/v3/f6-sprites-before-after.png (sopra prima, sotto dopo, 4×).
- Punti aperti: i passi di tinta delle rampe del piano superano i 20° (vedi DECISIONS) [CHECK]; F7 (Sensor lab) quando c'è il materiale.

## Screenshot finali (tests/screenshots/v3/, cartella non nel repo)
final-home-1280/390, final-story-1280/390, final-nipotyno-1280/390, final-play-1280/390, final-play-pause-1280/390, final-multiplayer-1280/390.
