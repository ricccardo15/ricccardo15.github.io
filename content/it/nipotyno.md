<!-- [CHECK] translation to review (IT: Riccardo). Translated from content/nipotyno.md on 21/10/2026. -->
---
title: "Nipotyno — Un mentore digitale per gli anziani che usano i servizi pubblici"
slug: nipotyno
base: "Prima base"
description: "Ricerca e design UX di un assistente guidato a doppio schermo che aiuta le persone anziane a prenotare visite mediche e pagare bollettini pubblici online. SUS 78,75, 100% dei compiti completati."
og_image: /assets/nipotyno/home_05.webp
cover: /assets/nipotyno/home_05.webp
tldr: "In Italia gli anziani devono usare servizi pubblici online che trovano stressanti. Con un team di 4 ho studiato come se la cavano, abbiamo progettato due concept alternativi e trasformato il vincitore in un 'mentore digitale' a doppio schermo. Nei test con 6 anziani, tutti hanno completato entrambi i compiti; SUS 78,75 (Buono)."
stats: "13 interviste · 6 partecipanti · SUS 78,75"
role: "UX researcher e designer (team di 4)"
team: "Riccardo Cirillo, Fabio Vito Papapicco, Andrea Ramaglia Bianchino, Ilaria Salami"
context: "HCI Project — MSc Human-Computer Interaction and Design, Universidad Politécnica de Madrid"
duration: "feb – giu 2026"
tools: "Interviste, osservazione, personas, modello dei compiti, Figma, test think-aloud, SUS, UEQ"
---

## In breve {#tl-dr}
In Italia gli anziani sono spinti a prenotare visite mediche (CUP) e pagare bollettini pubblici (pagoPA) online, e molti dipendono dai figli per farlo. Con un team di 4 ho studiato come se la cavano, abbiamo progettato due concept alternativi e fatto evolvere il vincitore in un "mentore digitale" a doppio schermo. **6/6 partecipanti hanno completato entrambi i compiti · SUS 78,75 (Buono) · tutte e 6 le scale UEQ Buono o Eccellente.**

## Il mio ruolo
- **Ricerca:** ho condotto con il team le 13 interviste e le 5 osservazioni e le ho trasformate in personas e in un modello dei compiti.
- **Bassa fedeltà:** mi sono occupato del **visual design** dei due prototipi in Figma; ho condotto 2 delle 6 sessioni di test e ho fatto il "computer" (Mago di Oz) in altre 2; ho analizzato i dati di 2 partecipanti; ho scritto i capitoli di introduzione e metodo.
- **Alta fedeltà:** ho costruito il **flusso di prenotazione CUP** in Figma; ho scritto il protocollo del test (script di benvenuto, procedura, consenso informato); ho condotto 2 sessioni e ne ho osservate 2; ho fatto l'**analisi quantitativa** (errori, tempi, azioni).
- **Business:** ho scritto con il team il business plan del concept (corso Entrepreneurship and Business Modelling).

## Il problema
CUP (*Centro Unico di Prenotazione*, il sistema regionale per prenotare visite mediche) e pagoPA (la piattaforma nazionale per pagare le pubbliche amministrazioni) sono obbligatori per molte attività quotidiane. Per chi ha più di 70 anni sono fonte di ansia: moduli fitti, linguaggio tecnico e la paura di fare un errore irreversibile. Molti semplicemente delegano alla famiglia.

**Come potremmo aiutare gli anziani a completare questi compiti da soli, senza la paura di "rompere" qualcosa?**

## Ricerca
Abbiamo intervistato 13 persone e ne abbiamo osservate 5 mentre provavano compiti reali. Tre modelli di comportamento hanno guidato tutto il resto:
- **Soluzione ibrida:** mescolare carta, telefonate e una persona che aiuta per portare a termine un compito digitale.
- **Silo mnemonico:** memorizzare una sequenza esatta di tocchi; qualsiasi cambiamento la rompe.
- **Ricerca di un porto sicuro:** cercare una persona o un luogo familiare che confermi ogni passaggio.

Non serviva un tutorial migliore, ma **un secondo paio d'occhi** che confermi ogni passaggio.

![Mappa di navigazione del prototipo ad alta fedeltà: benvenuto, menu principale, flussi CUP e pagoPA](/assets/nipotyno/navigation-map.webp)

## Idee: due concept a confronto
- **A · Digital Gym:** imparare facendo: una breve lezione, poi prove ed errori in libertà con un riscontro immediato.
- **B · Interactive Mentor:** due schermi coordinati: il servizio sul telefono e un "mentore" su un secondo schermo che indica il passo successivo e chiede conferma prima di andare avanti.

Li abbiamo costruiti entrambi come prototipi a bassa fedeltà in Figma e testati con 6 anziani con il think-aloud. **Ha vinto il Mentore**: meno errori, più efficienza, SUS 95,0, ed era il preferito di chi aveva più difficoltà. Gli utenti più sicuri preferivano la Gym: un segnale utile per dopo.

## Prototipo
Abbiamo trasformato il Mentore in un prototipo ad alta fedeltà a doppio schermo: a sinistra il servizio, a destra l'assistente con istruzioni brevi e gentili ("Tocca i riquadri bianchi per compilarli").

![Benvenuto: l'assistente si presenta e permette di ingrandire il testo](/assets/nipotyno/home_02.webp)

![Prenotazione CUP: l'assistente spiega come compilare il modulo prima di iniziare](/assets/nipotyno/cup_03.webp)

![Prenotazione CUP: guida passo passo mentre si inserisce il codice della ricetta](/assets/nipotyno/cup_04.webp)

![Pagamento pagoPA: l'assistente mostra dove si trova il codice QR sul bollettino cartaceo](/assets/nipotyno/pa_02.webp)

Un'iterazione è nata direttamente dai test: i partecipanti esitavano davanti ai pulsanti di pagamento solo testuali, quindi **li abbiamo sostituiti con icone riconoscibili** (banca, carta).

## Test
6 partecipanti, sessioni da remoto e facsimili cartacei realistici (ricetta, bollettino pagoPA, carta di prova), così nessuno doveva inventarsi i dati.

![Materiale del test: un facsimile di bollettino pagoPA con dati fittizi usato durante le sessioni](/assets/nipotyno/pagopa.webp)

| Metrica | Risultato |
|---|---|
| Compiti completati | **100%** (6/6 in entrambi i compiti) |
| SUS | **78,75** (Buono; la media è 68) |
| UEQ | Tutte e 6 le scale **Buono o Eccellente** |
| Errori rispetto alla bassa fedeltà | **−10%** prenotazione CUP · **−16%** pagamento pagoPA |

## Risultato
Il concept ha retto in condizioni realistiche. Una partecipante ha detto che l'esperienza l'ha fatta sentire indipendente dalla famiglia e dagli uffici pubblici: proprio l'obiettivo del progetto.

![Pagamento pagoPA: schermata di riepilogo prima di pagare](/assets/nipotyno/pa_07.webp)

## Cosa cambierei
- **Mostrare il formato prima che arrivi l'errore:** il campo del codice fiscale ha causato 8 degli errori dei due partecipanti più anziani.
- **Rendere ogni errore recuperabile:** un'email sbagliata ha bloccato un partecipante e ha richiesto il facilitatore.
- **Distinguere meglio i metodi di pagamento:** 2 su 6 all'inizio hanno scelto quello sbagliato.
- **Testare con più utenti over 80, in presenza:** reclutare questa fascia d'età da remoto è stato il limite più grande.
