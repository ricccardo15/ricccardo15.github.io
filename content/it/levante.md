<!-- [CHECK] translation to review (IT: Riccardo). Translated from content/levante.md on 21/10/2026, updated on 29/10/2026 (F2). -->
---
title: "Levante — Sapere in poche ore se il mare è sicuro"
slug: levante
base: "Seconda base"
description: "Service e dashboard design per una boa con IA edge che rileva i batteri nelle acque di balneazione. Il concept riduce il tempo di conferma da ~48 a ~3 ore. EIT Digital Summer School 2026, voto finale 9/10."
og_image: /assets/levante/dashboard.webp
cover: /assets/levante/buoy-0.webp
tldr: "Oggi servono 24–48 ore per confermare che l'acqua di balneazione è contaminata. In una challenge EIT Digital di una settimana, il nostro team di 6 ha progettato Levante: una boa sensore a energia solare con IA edge e un servizio di monitoraggio. Ho studiato le norme e co-creato le personas e le journey map. Ho anche progettato la dashboard di monitoraggio."
stats: "~48 h → ~3 h (concept) · team di 6 · voto 9/10"
role: "UX e service designer: ho progettato la dashboard di monitoraggio (team di 6)"
team: "Team di 6"
context: "EIT Digital Summer School 2026 · ISEN Méditerranée, Francia · Challenge 4 \"The Invisible Contamination\""
duration: "1 settimana · lug 2026"
tools: "Desk research, personas, journey map, UI design della dashboard, business model canvas, pitch"
---

## In breve {#tl-dr}
Quando una spiaggia è contaminata, la conferma del laboratorio arriva 24–48 ore dopo, quando le persone hanno già fatto il bagno. In una challenge di una settimana il nostro team di 6 ha progettato Levante: una boa a energia solare con IA a bordo che prevede la contaminazione, più una dashboard per laboratori e comuni. Con la qPCR sul posto, il concept riduce la conferma da **~48 a ~3 ore**. Ho progettato io la dashboard di monitoraggio.

## Il mio ruolo
- Ho studiato le norme europee sulle acque di balneazione e come funziona il monitoraggio in Italia, Francia e Spagna.
- Con il team ho creato le personas e le journey map per personale di laboratorio, addetti al campionamento, attività balneari e famiglie.
- Ho progettato la dashboard di monitoraggio (mappa del rischio, allerte per settore, stato dei campionamenti) e i render di concept della boa.
- Abbiamo sviluppato insieme il modello di business, e nel pitch finale ho presentato il problema e le personas.

## Il problema
L'acqua di balneazione si analizza prelevando campioni e coltivando i batteri in laboratorio, e il risultato richiede 24–48 ore. Italia, Francia e Spagna analizzano circa **73.000** campioni all'anno, tutti con quel ritardo. I segnali di allarme sono già nell'acqua, ma il risultato arriva alle persone troppo tardi per agire.

**Come potremmo dire alle persone se l'acqua è sicura quando conta ancora?**

## Ricerca
Abbiamo mappato le persone che vivono con quel ritardo:
- Ping, una madre i cui figli si sono ammalati dopo il bagno: *"Ho bisogno di sapere il prima possibile se la spiaggia è sicura."*
- Per Gabriella, responsabile di un laboratorio di qualità delle acque, campionamento e analisi richiedono troppo tempo e gli esperimenti costano.
- Addetti al campionamento e attività balneari hanno bisogno di decisioni chiare e tempestive.

![Persona: Ping, una madre che ha bisogno di sapere in fretta se l'acqua è sicura (ritratto generato con IA)](/assets/levante/persona-ping.webp)

![Persona: Gabriella, responsabile di laboratorio che ha bisogno di risultati affidabili e più rapidi (ritratto generato con IA)](/assets/levante/persona-gabriela.webp)

## Idee
Abbiamo progettato un servizio intorno al test di laboratorio. I sensori su una boa misurano torbidità, temperatura, conducibilità e pioggia, e un modello di IA edge stima il rischio sul posto. Quando il rischio è alto, una squadra sul campo controlla l'acqua con la qPCR e lo stato della spiaggia viene aggiornato.

![Flusso del servizio: raccolta dati, rilevazione del rischio, allerta, verifica sul campo, stato della spiaggia aggiornato](/assets/levante/architecture.webp)

## Prototipo
Ho progettato Tidewatch, la dashboard per laboratori e comuni. Mostra i settori e le allerte attive, una mappa del rischio della costa e un elenco delle allerte recenti con lo stato dei campionamenti. La squadra vede a colpo d'occhio dove andare per prima.

![Dashboard Tidewatch: settori, allerte attive, mappa del rischio e allerte recenti](/assets/levante/dashboard.webp)

![Render di concept della boa sensore a energia solare e dei suoi moduli](/assets/levante/buoy-0.webp)

## Modello di business
Le entrate verrebbero da tariffe per il servizio di laboratorio, un abbonamento alla dashboard comunale e licenze sui dati. Lo abbiamo organizzato in un business model canvas circolare.

![Business model canvas di Levante](/assets/levante/bmc.webp)

## Risultato
Abbiamo presentato Levante alla giuria della Summer School, e il progetto ha ottenuto un **voto finale di 9/10**.

## Cosa cambierei
- Testerei la dashboard con veri addetti di laboratorio. In una settimana abbiamo potuto verificarla solo all'interno del team.
- Progetterei anche la parte pubblica: uno stato della spiaggia semplice per famiglie come quella di Ping, con una mappa, un colore e l'ora dell'ultimo aggiornamento.
- La dashboard dovrebbe dire quanto è affidabile la previsione dell'IA, così nessuno chiude una spiaggia per un'ipotesi.
