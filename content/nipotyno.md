---
title: "Nipotyno — A digital mentor for older adults using public services"
slug: nipotyno
base: "1st base"
description: "UX research and design for a dual-screen assistant that guides older adults through booking medical visits and paying public bills online. SUS 78.75; 6/6 completed both tasks, one with help from the facilitator."
og_image: /assets/nipotyno/home_05.webp
cover: /assets/nipotyno/home_05.webp
tldr: "Older adults in Italy have to use public services online, and many find it stressful. In a team of 4 we studied how they cope and tested two concepts. The better one became a dual-screen 'digital mentor'. All 6 older adults in the final test completed both tasks, one with help from the facilitator; SUS 78.75 (Good)."
stats: "13 interviews · 6 testers · SUS 78.75"
role: "UX researcher & designer (team of 4)"
team: "Riccardo Cirillo, Fabio Vito Papapicco, Andrea Ramaglia Bianchino, Ilaria Salami"
context: "HCI Project, MSc Human-Computer Interaction and Design, Universidad Politécnica de Madrid"
duration: "Feb – Jun 2026"
tools: "Interviews, observation, personas, task model, Figma, think-aloud testing, SUS, UEQ"
---

<!-- Sources: HCI Project reports 4, 5, 6, 7 (credits tables). Interviews and business plan: team work (confirmed by Riccardo 20/10). -->

## TL;DR {#tl-dr}
Older adults in Italy are pushed to book medical visits (CUP) and pay public bills (pagoPA) online, and many depend on their children to do it. In a team of 4 we studied how they cope and tested two competing concepts. The better one became a dual-screen "digital mentor". **6/6 completed both tasks, one with help from the facilitator · SUS 78.75 (Good) · all 6 UEQ scales Good or Excellent.**

## My role
- In research, I ran the 13 interviews and 5 observations with the team, and we turned them into personas and a task model.
- For the low-fidelity round I did the visual design of both Figma prototypes. I facilitated 2 of the 6 test sessions, played the "computer" (Wizard of Oz) in 2 more and analysed the data of 2 participants. I also wrote the introduction and method chapters.
- For the high-fidelity prototype I built the CUP booking flow in Figma and wrote the test protocol (welcome script, process, consent form). I facilitated 2 sessions, observed 2 more and ran the quantitative analysis of mistakes, time and actions.
- With the team, I co-wrote the business plan for the concept in the Entrepreneurship and Business Modelling course.

## The problem
CUP (*Centro Unico di Prenotazione*, the regional system to book medical visits) and pagoPA (the national platform to pay public administrations) are mandatory for many everyday tasks. For people over 70 they cause real anxiety. The forms are dense and full of technical words, and many are afraid of making a mistake they can't undo, so they hand the task to a family member.

**How might we help older adults complete these tasks on their own, without fear of "breaking" something?**

## Research
We interviewed 13 people and observed 5 of them doing real tasks. We found three patterns of behaviour:
- In a "hybrid workaround", people mix paper, phone calls and a helper to get through a digital task.
- With a "mnemonic silo", they memorise one exact sequence of taps, and any change breaks it.
- In a "safe-haven search", they look for a person or a familiar place to confirm every step.

What they needed was a second pair of eyes that confirms each step.

![Navigation map of the high-fidelity prototype: onboarding, main hub, CUP and pagoPA flows](/assets/nipotyno/navigation-map.webp)

## Ideas: two competing concepts
- A · Digital Gym teaches by doing: a short lesson, then free trial and error with immediate feedback.
- B · Interactive Mentor uses two coordinated screens. The phone shows the service, and a "mentor" on a second screen points to the next step and asks for confirmation before moving on.

We built both as low-fidelity Figma prototypes and tested them with 6 older adults, who thought aloud as they worked. The Mentor won. It led to fewer mistakes, better efficiency and a SUS of 95.0, and the participants who struggled most preferred it. The more confident users liked the Gym better.

## Prototype
We turned the Mentor into a high-fidelity, dual-screen prototype. The left screen is the service. The right screen is the assistant, which gives short, friendly instructions like "Tap the white boxes to fill them in".

![Onboarding: the assistant introduces itself and lets the user enlarge the text](/assets/nipotyno/home_02.webp)

![CUP booking: the assistant explains how to fill in the form before the user starts](/assets/nipotyno/cup_03.webp)

![CUP booking: step-by-step guidance while entering the prescription code](/assets/nipotyno/cup_04.webp)

![pagoPA payment: the assistant shows where the QR code is on the paper bill](/assets/nipotyno/pa_02.webp)

One change came straight from testing. Participants hesitated on the text-only payment buttons, so we replaced them with icons they could recognise (bank, card).

## Test
We tested with 6 participants in remote sessions. They used realistic paper facsimiles (a prescription, a pagoPA bill and a test card), so nobody had to invent data.

![Test material: a pagoPA bill facsimile with fictitious data used during the sessions](/assets/nipotyno/pagopa.webp)

| Metric | Result |
|---|---|
| Task success | **6/6** · 1 with help |
| SUS | **78.75** (Good; average is 68) |
| UEQ | All 6 scales **Good or Excellent** |
| Mistakes vs low-fi | **−10%** CUP booking · **−16%** pagoPA payment |

## Result
The concept worked under realistic test conditions. One participant said the experience made her feel independent from her family and from public offices, which was the aim of the project.

![pagoPA payment: summary screen before paying](/assets/nipotyno/pa_07.webp)

## What I'd change
- I'd show format hints before errors happen. The *codice fiscale* (tax code) field caused 8 of the mistakes of the two oldest participants.
- Every error should be recoverable. A wrong email blocked one participant, and the facilitator had to step in.
- The payment methods need to look more different from each other: 2 of 6 participants chose the wrong one at first.
- Next time I'd test with more people over 80, in person. Recruiting this age group remotely was the biggest limitation of the study.
