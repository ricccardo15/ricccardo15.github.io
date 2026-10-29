<!-- [CHECK] translation to review (IT: Riccardo). Translated from content/nipotyno.md on 21/10/2026, updated on 29/10/2026 (F2). -->
---
title: "Nipotyno — Un mentore digitale per gli anziani che usano i servizi pubblici"
slug: nipotyno
base: "Prima base"
description: "Ricerca e design UX di un assistente a doppio schermo che guida le persone anziane a prenotare visite mediche e pagare bollettini pubblici online. SUS 78,75, 100% dei compiti completati."
og_image: /assets/nipotyno/home_05.webp
cover: /assets/nipotyno/home_05.webp
tldr: "In Italia gli anziani devono usare i servizi pubblici online, e molti lo trovano stressante. In un team di 4 abbiamo studiato come se la cavano e testato due concept. Il migliore è diventato un 'mentore digitale' a doppio schermo. Tutti e 6 gli anziani del test finale hanno completato entrambi i compiti; SUS 78,75 (Buono)."
stats: "13 interviste · 6 partecipanti · SUS 78,75"
role: "UX researcher e designer (team di 4)"
team: "Riccardo Cirillo, Fabio Vito Papapicco, Andrea Ramaglia Bianchino, Ilaria Salami"
context: "HCI Project, MSc Human-Computer Interaction and Design, Universidad Politécnica de Madrid"
duration: "feb – giu 2026"
tools: "Interviste, osservazione, personas, modello dei compiti, Figma, test think-aloud, SUS, UEQ"
---

## In breve {#tl-dr}
In Italia gli anziani sono spinti a prenotare visite mediche (CUP) e pagare bollettini pubblici (pagoPA) online, e molti dipendono dai figli per farlo. In un team di 4 abbiamo studiato come se la cavano e testato due concept alternativi. Il migliore è diventato un "mentore digitale" a doppio schermo. **6/6 partecipanti hanno completato entrambi i compiti · SUS 78,75 (Buono) · tutte e 6 le scale UEQ Buono o Eccellente.**

## Il mio ruolo
- Nella ricerca ho condotto con il team le 13 interviste e le 5 osservazioni, e insieme le abbiamo trasformate in personas e in un modello dei compiti.
- Nella fase a bassa fedeltà ho curato il visual design dei due prototipi in Figma. Ho condotto 2 delle 6 sessioni di test, ho fatto il "computer" (Mago di Oz) in altre 2 e ho analizzato i dati di 2 partecipanti. Ho anche scritto i capitoli di introduzione e metodo.
- Per il prototipo ad alta fedeltà ho costruito il flusso di prenotazione CUP in Figma e ho scritto il protocollo del test (script di benvenuto, procedura, consenso informato). Ho condotto 2 sessioni, ne ho osservate altre 2 e ho fatto l'analisi quantitativa di errori, tempi e azioni.
- Con il team ho scritto il business plan del concept nel corso Entrepreneurship and Business Modelling.

## Il problema
CUP (*Centro Unico di Prenotazione*, il sistema regionale per prenotare visite mediche) e pagoPA (la piattaforma nazionale per pagare le pubbliche amministrazioni) sono obbligatori per molte attività quotidiane. Per chi ha più di 70 anni sono una vera fonte di ansia. I moduli sono fitti e pieni di parole tecniche, e molti hanno paura di fare un errore che non si può annullare, così passano il compito a un familiare.

**Come potremmo aiutare gli anziani a completare questi compiti da soli, senza la paura di "rompere" qualcosa?**

## Ricerca
Abbiamo intervistato 13 persone e ne abbiamo osservate 5 mentre svolgevano compiti reali. Abbiamo trovato tre modelli di comportamento:
- Con una "soluzione ibrida", le persone mescolano carta, telefonate e qualcuno che aiuta per portare a termine un compito digitale.
- Con un "silo mnemonico", memorizzano una sequenza esatta di tocchi, e qualsiasi cambiamento la rompe.
- Nella "ricerca di un porto sicuro", cercano una persona o un luogo familiare che confermi ogni passaggio.

Serviva loro un secondo paio d'occhi che confermi ogni passaggio.

![Mappa di navigazione del prototipo ad alta fedeltà: benvenuto, menu principale, flussi CUP e pagoPA](/assets/nipotyno/navigation-map.webp)

## Idee: due concept a confronto
- A · Digital Gym insegna facendo: una breve lezione, poi prove ed errori in libertà con un riscontro immediato.
- B · Interactive Mentor usa due schermi coordinati. Il telefono mostra il servizio, e un "mentore" su un secondo schermo indica il passo successivo e chiede conferma prima di andare avanti.

Li abbiamo costruiti entrambi come prototipi a bassa fedeltà in Figma e testati con 6 anziani, che pensavano ad alta voce mentre li usavano. Ha vinto il Mentore. Ha portato a meno errori, più efficienza e un SUS di 95,0, ed era il preferito di chi aveva più difficoltà. Gli utenti più sicuri preferivano la Gym.

## Prototipo
Abbiamo trasformato il Mentore in un prototipo ad alta fedeltà a doppio schermo. Lo schermo a sinistra è il servizio. Quello a destra è l'assistente, che dà istruzioni brevi e gentili come "Tocca i riquadri bianchi per compilarli".

![Benvenuto: l'assistente si presenta e permette di ingrandire il testo](/assets/nipotyno/home_02.webp)

![Prenotazione CUP: l'assistente spiega come compilare il modulo prima di iniziare](/assets/nipotyno/cup_03.webp)

![Prenotazione CUP: guida passo passo mentre si inserisce il codice della ricetta](/assets/nipotyno/cup_04.webp)

![Pagamento pagoPA: l'assistente mostra dove si trova il codice QR sul bollettino cartaceo](/assets/nipotyno/pa_02.webp)

Un cambiamento è nato direttamente dai test. I partecipanti esitavano davanti ai pulsanti di pagamento solo testuali, quindi li abbiamo sostituiti con icone riconoscibili (banca, carta).

## Test
Abbiamo testato con 6 partecipanti in sessioni da remoto. Hanno usato facsimili cartacei realistici (una ricetta, un bollettino pagoPA e una carta di prova), così nessuno ha dovuto inventarsi i dati.

![Materiale del test: un facsimile di bollettino pagoPA con dati fittizi usato durante le sessioni](/assets/nipotyno/pagopa.webp)

| Metrica | Risultato |
|---|---|
| Compiti completati | **100%** (6/6 in entrambi i compiti) |
| SUS | **78,75** (Buono; la media è 68) |
| UEQ | Tutte e 6 le scale **Buono o Eccellente** |
| Errori rispetto alla bassa fedeltà | **−10%** prenotazione CUP · **−16%** pagamento pagoPA |

## Risultato
Il concept ha funzionato in condizioni di test realistiche. Una partecipante ha detto che l'esperienza l'ha fatta sentire indipendente dalla famiglia e dagli uffici pubblici, ed era proprio lo scopo del progetto.

![Pagamento pagoPA: schermata di riepilogo prima di pagare](/assets/nipotyno/pa_07.webp)

## Cosa cambierei
- Mostrerei il formato prima che arrivi l'errore. Il campo del codice fiscale ha causato 8 degli errori dei due partecipanti più anziani.
- Ogni errore dovrebbe essere recuperabile. Un'email sbagliata ha bloccato un partecipante, e il facilitatore è dovuto intervenire.
- I metodi di pagamento devono distinguersi di più: 2 partecipanti su 6 all'inizio hanno scelto quello sbagliato.
- La prossima volta testerei con più persone over 80, in presenza. Reclutare questa fascia d'età da remoto è stato il limite più grande dello studio.
