# Roadmap — portfolio COMPLETO in 2 giorni (aggiornata 20/10/2026)

Riccardo vuole il portfolio finito e completo in un paio di giorni, da collegare al CV. Niente fasi lunghe: tutto il gioco + tutti i casi.
Divisione del lavoro: **Claude Code costruisce il sito** · **i contenuti (testi + immagini già pronte in `content/` e `public/assets/`) li prepara Claude nel progetto Internship, in parallelo.**
Una sessione = un blocco: plan mode → codice → verifica → commit → spunta → /clear.

## Definizione di "fatto" (ogni blocco)
- `npm run build` ok; Playwright + axe ok; nessun errore in console; screenshot 1280 px e 390 px controllati.
- Tastiera (Tab, focus visibile, Esc, Indietro del browser), contrasto ≥ 4.5:1, `prefers-reduced-motion`.
- Online aggiornato + commit.

## Giorno 1
- [x] **B1 Setup** — repo `ricccardo15.github.io`, Vite, deploy GitHub Pages, Playwright + axe. Link online: https://ricccardo15.github.io (20/10)
- [x] **B2 Sito base completo** — header (nome, ruolo, CV EN/ES, contatti), vista lista, pagine statiche con Open Graph per OGNI caso generate da `content/*.md` (`/nipotyno/`, `/levante/`, `/housing/`, `/lab/`), template caso studio. (20/10)
- [x] **B3 Diamante** — sfondo pixel 320×180 a scala intera, basi come link HTML, il battitore corre tra le basi (avanti/indietro con frecce/tap), pannello del caso. Mobile < 640 px: versione semplificata touch. (20/10)
- [x] **B4 Grafica pixel** — palette unica 16 colori, battitore 32×32 (idle, corsa, battuta), campo, icone delle basi, titolo pixel. Generata in codice/Aseprite JSON, 100% originale. (20/10)

## Giorno 2
- [ ] **B5 Start screen** — battitore grande + 3 divise (Researcher/Designer/Maker = palette swap + accessorio), pannello "How I design" (moodboard, principi, CV, contatti).
- [ ] **B6 Interazione** — battuta iniziale a tempo che non si può sbagliare → home run → tour che si ferma a ogni base (avanti/indietro/pausa, mai un video); poi modalità libera; battuta come extra ("take another swing").
- [ ] **B7 Rifinitura** — animazioni, suoni (spenti di default), reduced motion, mobile, velocità, anteprime OG, PDF dei casi con CSS di stampa.
- [ ] **B8 Test e pubblicazione** — prova con 2–3 persone (anche veloce), correzioni, link nel CV.

## Dopo
- [ ] Multisensory (dicembre)
