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
