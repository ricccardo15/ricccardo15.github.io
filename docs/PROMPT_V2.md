# Prompt per Claude Code: portfolio v2 "Lo stadio è il portfolio"

> **Come usarlo (Riccardo):**
> 1. Copia `MEETING_2026-10-21.md` in `docs/` del progetto.
> 2. Apri Code sulla cartella `Desktop/PORTFOLIO`, attiva il **plan mode** e incolla da "INIZIO PROMPT" fino alla fine.
> 3. Una fase per sessione: alla fine di ogni fase fai il commit, poi `/clear` e passi alla fase successiva incollando di nuovo il prompt con "Fai la Fase N".

---

## INIZIO PROMPT

Leggi `CLAUDE.md`, `docs/SPEC.md`, `docs/DECISIONS.md` e **`docs/MEETING_2026-10-21.md`**: il verbale della riunione di valutazione con 4 agenti (UX Researcher, Visual Designer, Front-end Dev, Recruiter). Le decisioni sono già prese: **non riaprirle**.

Questo prompt descrive 4 fasi. **In questa sessione fai solo la fase che ti indico** (se non lo dico: Fase 0). Per la fase:
1. Proponi il piano (plan mode) con la lista dei file che toccherai.
2. Fammi solo le domande che bloccano davvero, una alla volta.
3. Dopo la mia approvazione esegui, verifica la Definizione di fatto (`docs/ROADMAP.md`) e mostrami le prove: build, `npm test`, screenshot a 1280 e 390 px, tastiera, reduced motion.
4. Aggiungi una riga per decisione in `docs/DECISIONS.md` e aggiorna `docs/SPEC.md` dove cambia.

Regole sempre valide:
- Il sito funziona senza JS.
- Ogni caso resta una pagina statica con Open Graph e PDF.
- Arte 100% originale.
- Contrasto ≥ 4.5:1 e axe pulito.
- Mai pubblicare `docs/reference/`.
- Rispondi in italiano semplice.

I numeri di riga qui sotto si riferiscono al commit `e01fa8e`: se sono cambiati, cerca il codice citato.

---

## FASE 0: correzioni e tour nuovo (urgente, prima di mandare il link ai recruiter)

### 0.1 Etichette delle basi fuori posto durante lo zoom
`src/style.css:271-273`: `.stage.is-zoomed .bases { visibility: hidden }` si toglie di colpo, mentre `.world` torna alla scala normale in 0,5 s. Per circa 460 ms le etichette sono visibili sopra il campo ancora ingrandito.
- Aggiungi `.bases { transition: visibility 0s .5s; }` e `.stage.is-zoomed .bases { transition: none; }`, così le etichette tornano solo a zoom finito.
- Test (in `tests/game.spec.js`, describe "with motion"): durante gli 0,5 s di uscita dallo zoom `.bases` deve avere `visibility: hidden`.

### 0.2 Cronologia del browser
- `src/diamond.js:225` (dentro `tourStep`): usa `history.replaceState` al posto di `pushState`. L'URL resta condivisibile (`/#levante`) e un solo "Indietro" esce dal sito.
- Anche il click su una base (`go()`, `diamond.js:246`) usa `replaceState`. `pushState` resta solo per l'apertura del lettore del caso (Fase 2).
- Nel listener `popstate` (`diamond.js:329-337`): se l'hash non è una base e si è in modalità tour, passa a free.
- Aggiorna il test `the browser Back button walks back through the tour` (`tests/game.spec.js`): adesso deve verificare che dopo il tour basta **un** Indietro per tornare alla pagina precedente.

### 0.3 Accessibilità
- `scripts/pages.js:339`: togli `aria-live="polite"` da `#field-panel`. Gli annunci restano solo nel `role="status"` (`pages.js:336`).
- `scripts/pages.js:182, 194, 295, 359`: aggiungi `lang="es"` ai link verso il CV spagnolo (WCAG 3.1.2).

### 0.4 Tour senza timer (la richiesta più importante di Riccardo)
**Problema:** oggi la barra ha Back, Pause, Next, il contatore, il timer di 6 px senza etichetta ed "Explore freely". In più ogni base avanza da sola dopo 10 s. Chi visita non sa se cliccare o aspettare, e sul telefono la scheda cambia mentre la sta leggendo.

**Nuovo modello: nessun avanzamento automatico, mai.**
- **Da togliere** in `src/diamond.js`: `TOUR_WAIT` (r. 27), `paused`, `hold`, `ticking` (r. 47-49), `stopTimer` e `startTimer` (r. 199-217), la chiamata a `startTimer` in `tourStep` (r. 234), i listener mouseenter/mouseleave/focusin/focusout del pannello (r. 237-240), il ramo `pause` (r. 267) e la pausa su Esc (r. 305).
- **Da togliere** in `src/style.css:366-368`: `.timer`.
- **Barra del tour** (`scripts/pages.js:323-330`). Sostituiscila con:
  - un indicatore delle basi: un piccolo rombo pixel con 4 basi (piene se visitate, quella attuale evidenziata) più il testo `2 of 4 · Levante`. Va nell'angolo in alto a destra dello stage, ha `aria-hidden` e il testo equivalente va nello status;
  - un link discreto `✕ Exit tour` (prima si chiamava "Explore freely": un solo nome per un'azione sola. Togli anche "Just explore the bases" in `pages.js:321` e usa lo stesso testo ovunque).
- **I controlli vanno dentro la scheda**, dove l'utente sta già guardando: in fondo a ogni `article.panel-card` durante il tour, sotto "Read the case study".
  - Un solo pulsante principale: **`Next base: Levante →`**, con il nome della base successiva. Sull'ultima base: `Finish the tour →`.
  - Un solo secondario piccolo: `◀ Back` (nascosto alla prima tappa).
  - Generali dal JS, così il markup statico resta pulito senza JS.
- **L'animazione** (zoom e batti cinque, `moment()`) parte all'arrivo e non blocca niente: Next funziona anche durante l'animazione.
- **Cliccare un'altra base** durante il tour esce dal tour senza avvisi. Lo status dice "Tour ended. Free mode."
- **Il contatore** si aggiorna all'arrivo sulla base, insieme alla scheda (oggi si aggiorna prima: `updateTourBar` a r. 226, il pannello a r. 118).
- **TOUR** (`src/field-map.js`): 4 tappe di progetto più la scheda finale. Il rombo conta solo le 4 basi.
- **Test da riscrivere:** `Swing! → home run → tour with Back / Next…`, `clicking a base or "Explore freely" leaves the tour…` e `the pitch is hit, then a high five…; the timer pauses` (diventa: "nessun cambio di base senza click in 15 s").

### 0.5 Copertine
- **Lab:** crea `scripts/art/lab-cover.js` (registralo in `scripts/art.js`). È una **copertina pixel art 160×120**, palette del sito, ingrandita 4× nearest, salvata in `public/assets/lab/cover.webp` (PNG intermedio se serve). Soggetto: la **lavagna del dugout** con 5 mini-icone dei lavori del Lab: lente su una pagina (valutazione euristica), telefono con tab bar (Discord vs iOS), griglia di 6 vignette (storyboard), tre campioni di colore (colour study), "Aa" (type study). Arte originale; aggiorna `docs/CREDITS.md`.
- `content/lab.md:7`: `cover: /assets/lab/cover.webp`. Lo storyboard resta come card dentro la pagina Lab.
- `content/housing.md:7`: `cover: /assets/housing/wireflow-filters-visit.webp` (oggi è una foto di schizzi su carta).
- **Ritaglio delle card del Lab:** in `src/style.css:420` `object-position: top` mostra solo testo per `color.webp` e `type.webp`. Aggiungi la possibilità di decidere il ritaglio per immagine (per esempio un attributo `data-crop` impostato da pages.js, o una classe), con `bottom` per color.webp, dove c'è la foto di Cibeles.
- Lo `og_image` del Lab può restare quello attuale.

### 0.6 Dati che un recruiter spagnolo cerca subito
- Nella hero (`startScreen()`, `scripts/pages.js:349-376`), sotto il ruolo, aggiungi una riga piccola presa da `content/facts.md` (riga "Status" e riga "Languages"):
  `EU citizen · Spanish NIE · Italian (native) · English B2 · Spanish B2 · Curricular internship + master's thesis`
- La stessa riga va nell'About.
- **Niente LinkedIn finché Riccardo non ti dà l'URL.**
- Aggiungi **About** al menu (`scripts/pages.js:178-185`), con link a `/#about`.

### 0.7 Pagine caso
- `scripts/pages.js:236`: il link si chiama "← All case studies" ma porta allo stadio (`/#slug`). Rinominalo in `◀ Back to the ballpark · 1st base` (usa la label della base da `STOPS`) e aggiungi accanto `All case studies` → `/#work`.
- `src/style.css:409`: aggiungi a `figure img` un `max-height: 70vh; width: auto; margin-inline: auto` solo a schermo (la stampa ha già la sua regola a r. 458). Oggi una schermata di telefono occupa uno schermo intero e Nipotyno è alto 8.600 px.
- **Non riscrivere i testi dei casi.**

---

## FASE 1: pixel art più definita (480×270) e nuovi oggetti dello stadio

**Decisione:** risoluzione ×1,5, "leggermente più definita".

| Elemento | Prima | Dopo |
|---|---|---|
| Campo | 320×180 | **480×270** |
| Runner e crew | 32×32 | **48×48** |
| Icone | 16×16 | **24×24** |
| Palette | 16 colori | **24 colori** |

I nuovi colori: grassLight, dirtLight, navyMid, redDark, greyDark, greyLight, wood, hair.

**Scala:**
- Desktop ≥ 1000 px: `--fs: 2` (960×540).
- Fra 700 e 999 px: 1× (480×270) centrato.
- Telefono < 520 px: 1× con lo stage largo il 100% e la `.world` di 480 px **centrata e ritagliata** (circa 64 px tagliati per lato). **Tutti i punti cliccabili devono stare tra x = 64 e x = 416.**

Passi:
1. `src/field-map.js`: `FIELD = { width: 480, height: 270 }`. Moltiplica ×1,5 tutte le coordinate di `STOPS` e `CREW`. Lo stesso per `src/batting.js:9-12` (RELEASE, PLATE, CATCHER, OUT) e per `zoomOn` in `diamond.js` (usa `FIELD`, verifica i clamp).
2. `src/palette.js` e `tests/art.spec.js` (`palette has exactly 16 colours` → 24).
3. `scripts/art/*.js`: ridisegna `field.js`, `runner.js`, `crew.js` e `icons.js` alla nuova dimensione. Le mappe `HEAD` e `TORSO` del runner vanno ridisegnate, non ingrandite. Le pose: articolazioni ×1,5, poi ritocco.
   - **Da migliorare nel campo:** tribune con profondità (2-3 file con ombra), dugout con tetto in prospettiva (oggi è un rettangolo), erba con taglio a strisce più morbido.
   - **Nuovi oggetti, che in Fase 2 saranno punti cliccabili:**
     - **tabellone** in alto al centro, con spazio per testo pixel (sarà "About");
     - **biglietteria / press box** nella tribuna, dentro la zona x 64–416 (sarà "Contact & CV");
     - **monte di lancio** ben riconoscibile (sarà "How I design").
   - Il bullpen resta solo decorativo, a destra, per Multisensory a dicembre.
4. `src/style.css`: sostituisci le dimensioni scritte a mano dei fogli sprite (r. 126-129, 244-247, 283-311: 32px, 480px, 96px, 256px…) con variabili `--cell` / `--sheet-w` / `--sheet-h`. Rivedi le media query della scala (r. 203-214).
5. `scripts/pages.js`, `ogHome()` (r. 114-131): ritaglio delle celle e scala per 48 px e il campo 480. Le anteprime OG restano 1200×630.
6. **Test:**
   - `field art is pixel-perfect: 320×180…` e `field at 1× (320×180…)` → 480×270;
   - deep link `/#lab`;
   - nuovo test di **scala intera** a 1280×800, 1440×900, 1536×730 e 390×844 (larghezza dell'immagine = 480 × intero, oppure 480 con ritaglio su telefono);
   - peso della prima pagina < 1,5 MB (test esistente).

---

## FASE 2: lo stadio come centro di navigazione, con la lobby

**Obiettivo di Riccardo:** il portfolio vive dentro lo stadio. Un click apre la scheda senza uscire e senza dover scorrere. Chi non vuole battere clicca direttamente.

**Vincolo della riunione:** la prima schermata da 10 s resta, e lista, About e pagine statiche restano nel DOM sotto lo stadio (senza JS, link Skip, test, anteprime).

**Prima di iniziare:** dividi `src/diamond.js` in moduli: `src/game.js` (avvio e stato), `src/tour.js`, `src/spots.js` e `src/reader.js`. `route()` e `runTo()` restano come sono: funzionano.

### 2.1 Lobby pre-partita, che è il primo schermo (riscrivi `startScreen()`, `pages.js:349-376`)
Desktop, sfondo a fascia "tunnel/clubhouse" (armadietti pixel, originale):

- **Sinistra (≈ 40%):** titolo pixel `SELECT YOUR PLAYER`, il battitore grande (48 px a 5× = 240 px) su una piastra di casa base, e sotto 3 riquadri divisa stile "character select" (ritratto, nome, 3 skill).
  - Il selezionato ha la cornice rossa e un cursore ▶ (fisso con reduced motion).
  - Si sceglie con click, frecce o Tab.
  - Restano i radio attuali e lo switch CSS con `:has()` (`style.css:116-117`).
  - Ogni riquadro mostra `Suggested first base: Housing` (dati in `src/uniforms.js`).
- **Destra (≈ 60%):** **figurina da baseball = About breve.**
  - Nome pixel e `UX Research & Design intern · Madrid · Feb–Jul 2027`.
  - Il motto.
  - La riga di stato della Fase 0.6.
  - 3 "stats" (per esempio `3 countries · 3 languages · SUS 78.75`).
  - 2 righe di bio, prese dalla sezione "Hi, I'm Riccardo" di `content/about.md`.
  - Pulsanti secondari CV EN, CV ES, email.
  - Link `Start here: Nipotyno →`.
  - La divisa cambia i colori della figurina.
- **Un solo pulsante principale:** `▶ Enter the ballpark`, che porta allo stadio. Accanto, link testuale `Skip → Case studies`.
- **Nessun cancello:** tutto è già visibile e cliccabile. "Enter" è facoltativo.
- **Mobile:** tutto in colonna. Battitore a 3× con ◀ ▶ per cambiare divisa, figurina compatta, pulsante "Enter the ballpark" ben visibile.
- **I test del primo schermo devono continuare a passare:** `first screen shows name, role, CV, contact and a way into Nipotyno` e `name, CV, contact and Nipotyno are on the first screen…`.

### 2.2 Stadio a schermo intero
- La sezione `#field` occupa `100dvh` meno l'header. Lo stage è centrato a scala intera (Fase 1). Il layout a due colonne `644px 1fr` (`style.css:210-211`) sparisce.
- **Entrata:** "Enter the ballpark" porta allo stadio. Il runner esce dal dugout e va a casa base (`route('lab','home')`, già esiste). Con reduced motion niente animazione.
- **Battuta in evidenza:** sposta `.swing` (`pages.js:320`) **dentro lo stage**, come grande pulsante pixel accanto a casa base: `⚾ Swing!`. Sotto, ben leggibile: `or click anything in the ballpark`. Il nome accessibile "Swing!" resta (test).
- I lanci partono come oggi, ma le basi e i punti sono sempre cliccabili.

### 2.3 Punti cliccabili (massimo 8)
In `src/field-map.js` aggiungi un array **`SPOTS`**, separato da `STOPS` e `RING`, così il percorso del runner e le frecce ← → non cambiano:

| Punto | Apre |
|---|---|
| Tabellone | **About** come "player stats": bio, studi (Trento, UPM, Torino), lingue, stato, "Why baseball?", toolbox |
| Monte di lancio | **How I design**: principi, le 3 divise con le skill, moodboard |
| Biglietteria / press box | **Contact & CV**: email, CV EN/ES |
| Basi e dugout | come oggi |
| Casa base | start / scheda finale |

- `diamond()` in `pages.js` (r. 261-264) li genera come le basi: `<a>` veri, con href che funzionano senza JS (`#about`, `#how`, `#contact`). Il contenuto riusa `howIDesign()` e le parti di `aboutParts` (`pages.js:379-433`).
- **Etichette:**
  - desktop: etichetta come le basi;
  - telefono: solo icona 24 px con nome accessibile, più una **legenda "Stadium map"** sotto lo stage (lista di link, anche navigazione da tastiera).
- Mai etichette visibili solo al passaggio del mouse.

### 2.4 Schede dentro lo stadio
`#field-panel` diventa una **scheda sovrapposta** allo stadio.
- **Desktop:**
  - drawer a destra largo circa 400 px, non modale;
  - cornice pixel: bordo navy di 2 px più un'ombra rossa sfalsata di 4 px, come il titolo;
  - la "camera" (`.world`) scorre un po' a sinistra, così la base attiva resta visibile;
  - testo con il font di sistema da 1rem, larghezza massima circa 60 caratteri, nessuna dissolvenza (scelta già fatta a `style.css:376`).
- **Telefono:** bottom sheet alto circa il 60%, con lo stage che resta visibile sopra (sticky).
- **Esc chiude**, il focus torna al punto cliccato e c'è un pulsante `✕ Close` visibile.
- **Schede dei casi:** copertina, kicker, TL;DR, ruolo, 2-3 numeri chiave, `Read the case study →` e `PDF`. Durante il tour, i controlli della Fase 0.4.

### 2.5 Leggere il caso senza uscire dallo stadio (`src/reader.js`)
- Intercetta i link con `data-read`: "Read the case study" (`pages.js:286`), "Start here" (`pages.js:362`), le card della lista (`pages.js:417`) e la navigazione precedente/successivo dentro il caso.
- Al click: `fetch(href)` → `DOMParser` → prende `article.case` → lo mette in un **`<dialog aria-labelledby>` a tutto schermo** (stile "menu di pausa": fascia pixel in alto con il nome del caso e `✕ Back to the ballpark`) → `showModal()` → `history.pushState({reader:true}, '', href)`.
- **Chiusura:**
  - con Esc o ✕ → `history.back()`;
  - `popstate` chiude il dialog;
  - il focus torna al link d'origine;
  - lo scroll della pagina sotto viene ripristinato.
- Un reload su `/nipotyno/` apre la pagina statica normale (OG e PDF intatti).
- **Fallback:** senza JS, o se il fetch fallisce → navigazione normale.
- Le immagini dentro il dialog seguono la regola `max-height` della Fase 0.7.
- **Test nuovi:**
  - apre e chiude con Esc e con Indietro;
  - l'URL cambia e torna;
  - il focus torna al link;
  - nessun id duplicato;
  - axe pulito con il dialog aperto.

### 2.6 Pagine caso statiche
Fascia pixel in cima, riusando `pixelLayer` e il layout di `ogCase` (`pages.js:98, 133-146`), con l'icona della base e `◀ Back to the ballpark · 1st base`.

### 2.7 Test
- Aggiorna `Play ball! goes to the field, Skip goes to the list` (il pulsante si chiama "Enter the ballpark").
- Aggiorna i test del campo e della scheda.
- Nuovo test: "dalla lobby a un caso letto in ≤ 3 click senza scorrere" a 1280×800.

---

## FASE 3: lingue EN (default) / ES / IT

**Ordine:** infrastruttura e correzioni → ES → IT. Le traduzioni le scrivi tu partendo dall'inglese. Segna in cima a ogni file tradotto `<!-- [CHECK] translation to review -->`: Riccardo le farà rivedere (ES da un madrelingua, IT da lui).

1. **Correzioni prima** (oggi la build si romperebbe):
   - `slugify` (`pages.js:44`): normalizza gli accenti con `normalize('NFD')` e rimuovi i diacritici prima della regex. Oggi "Investigación" diventa `investigaci-n`.
   - `pages.js:430` e `:433` cercano gli id inglesi `how-i-design` e `contact`: usa id espliciti nel markdown (per esempio `{#how-i-design}` o un campo nel frontmatter), indipendenti dalla lingua.
   - `#tl-dr` (`style.css:404`) dipende dal titolo "TL;DR": usa una classe.
   - `scripts/art/title.js` (`GLYPHS`): aggiungi i glifi `Á É Í Ó Ú Ñ À È Ì Ò Ù ¿ ¡`, altrimenti l'errore `no pixel glyph` blocca le anteprime OG in ES/IT.
2. **Contenuti:** `content/*.md` resta l'inglese; aggiungi `content/es/*.md` e `content/it/*.md`. `content/facts.md` non va tradotto.
3. **Generatore** (`generate()`, `pages.js:467`): un ciclo `LANGS = ['en','es','it']` con prefisso `''`, `/es` o `/it`. Scrive `es/index.html`, `es/<slug>/index.html` e così via. **`PAGES` (`pages.js:23`) deve contenerle tutte**, altrimenti Vite non le costruisce.
4. **`layout()`:**
   - `<html lang>` dinamico (oggi fisso a `pages.js:153`);
   - `<link rel="alternate" hreflang>` per ogni lingua più `x-default` = EN;
   - `og:locale`;
   - canonical per lingua.
5. **Stringhe dell'interfaccia** in un dizionario `src/i18n.js`, usato da pages.js. Riguarda: header e footer (`pages.js:174-196`), schede e barra del gioco (`270-336`), lobby (`349-376`), How I design (`384-406`), `facts()` (`207-211`), le label di `STOPS` e `SPOTS`, `UNIFORMS`. I testi del JS (status, nomi dei pulsanti del tour) arrivano dal generatore come attributi `data-*`, non scritti nel JS.
6. **Selettore di lingua** nell'header a destra: segmentato `EN · ES · IT` in stile tabellone (sfondo navy, lingua attiva in giallo palette, contrasto ≥ 4.5:1).
   - Etichette di testo, niente bandiere.
   - Ogni voce è un link alla **stessa pagina** nell'altra lingua, con `hreflang` e `lang`.
   - `aria-current` sulla lingua attiva.
   - La scelta si ricorda in localStorage, con redirect solo su `/` e solo se la scelta è salvata (mai in base alla lingua del browser).
   - Il CV nell'header segue la lingua: EN per EN e IT, ES per ES. L'altro resta disponibile nella figurina.
7. **PDF:** `pdfName` (`pages.js:21`) con suffisso di lingua (`_ES`, `_IT`) e generazione per lingua in `scripts/pdf.js`.
8. **Test:** i test smoke e axe per ogni lingua (ciclo sui path), più un test su `lang`, `hreflang`, il selettore e il CV giusto.

---

## CHIUSURA (= B8 della ROADMAP): mini-test con 3 persone

Prepara in `docs/TEST_PLAN.md` il test proposto dall'UX Researcher. Riccardo lo farà; tu poi correggi.
- **Persone:** P1 recruiter o non designer su desktop · P2 designer su telefono · P3 solo tastiera.
- **T1, 5 secondi sulla home:** "chi è, cosa cerca, cosa si può fare qui?" (pass se ricorda ruolo, Madrid e date).
- **T2:** "Trova il progetto con il test di usabilità: punteggio SUS e ruolo di Riccardo" (obiettivo < 30 s desktop, < 45 s telefono).
- **T3:** "Fai il tour, fermati su Housing, leggilo, poi vai avanti" (click sbagliati, esitazioni oltre 3 s, "sapevi se aspettare o cliccare?", SEQ 1-7).
- **T4:** "Dove ha studiato?" (tempo per trovare l'About).
- **T5:** "Torna da dove sei venuto" (numero di Indietro, obiettivo 1).
- **Alla fine:** UMUX-Lite.

## Domande aperte per Riccardo (chiedile quando arrivi al punto, non prima)
1. **Nipotyno:** perché il SUS scende da 95.0 (lo-fi, `content/nipotyno.md:46`) a 78.75 (hi-fi)? Serve una frase sul sito.
2. **Nipotyno:** "100% (6/6)" e "una mail sbagliata ha bloccato un partecipante e ha richiesto il facilitatore" (`nipotyno.md:68, 80`): va scritto "6/6, uno con aiuto"?
3. **Lab:** togliere "Colour observation" e "Type study: Caslon"?
4. **LinkedIn:** URL quando c'è.

## FINE PROMPT
