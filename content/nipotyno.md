---
title: "Nipotyno — A digital mentor for older adults using public services"
slug: nipotyno
base: "1st base"
description: "UX research and design of a guided, dual-screen assistant that helps older adults book medical visits and pay public bills online. SUS 78.75, 100% task success."
og_image: /assets/nipotyno/home_05.webp
cover: /assets/nipotyno/home_05.webp
tldr: "Older adults in Italy must use online public services they find stressful. With a team of 4, I researched how they cope, co-designed two competing concepts and turned the winner into a dual-screen 'digital mentor'. In testing with 6 older adults, everyone completed both tasks; SUS 78.75 (Good)."
stats: "13 interviews · 6 testers · SUS 78.75"
role: "UX researcher & designer (team of 4)"
team: "Riccardo Cirillo, Fabio Vito Papapicco, Andrea Ramaglia Bianchino, Ilaria Salami"
context: "HCI Project — MSc Human-Computer Interaction and Design, Universidad Politécnica de Madrid"
duration: "Feb – Jun 2026"
tools: "Interviews, observation, personas, task model, Figma, think-aloud testing, SUS, UEQ"
---

<!-- Sources: HCI Project reports 4, 5, 6, 7 (credits tables). Interviews and business plan: team work (confirmed by Riccardo 20/10). -->

## TL;DR {#tl-dr}
Older adults in Italy are pushed to book medical visits (CUP) and pay public bills (pagoPA) online, and many depend on their children to do it. With a team of 4, I researched how they cope, we designed two competing concepts and evolved the winner into a dual-screen "digital mentor". **6/6 participants completed both tasks · SUS 78.75 (Good) · all 6 UEQ scales Good or Excellent.**

## My role
- **Research:** ran the 13 interviews and 5 observations together with the team and turned them into personas and a task model.
- **Low-fidelity:** owned the **visual design** of the two Figma prototypes; facilitated 2 of the 6 test sessions and played the "computer" (Wizard of Oz) in 2 more; analysed the data of 2 participants; wrote the introduction and method chapters.
- **High-fidelity:** built the **CUP booking flow** in Figma; wrote the test protocol (welcome script, process, consent form); facilitated 2 sessions and observed 2; ran the **quantitative analysis** (mistakes, time, actions).
- **Business:** co-wrote the business plan for the concept with the team (Entrepreneurship and Business Modelling course).

## The problem
CUP (*Centro Unico di Prenotazione*, the regional system to book medical visits) and pagoPA (the national platform to pay public administrations) are mandatory for many everyday tasks. For people aged 70+ they are a source of anxiety: dense forms, technical language and the fear of making an irreversible mistake. Many simply delegate to family.

**How might we help older adults complete these tasks on their own, without fear of "breaking" something?**

## Research
We interviewed 13 people and observed 5 of them while they tried real tasks. Three behaviour patterns shaped everything that followed:
- **Hybrid workaround** — mixing paper, phone calls and a helper to get through a digital task.
- **Mnemonic silo** — memorising one exact sequence of taps; any change breaks it.
- **Safe-haven search** — looking for a person or a familiar place to confirm every step.

What they needed was not a better tutorial, but **a second pair of eyes** that confirms each step.

![Navigation map of the high-fidelity prototype: onboarding, main hub, CUP and pagoPA flows](/assets/nipotyno/navigation-map.webp)

## Ideas: two competing concepts
- **A · Digital Gym** — learning by doing: a short lesson, then free trial and error with immediate feedback.
- **B · Interactive Mentor** — two coordinated screens: the service on the phone, a "mentor" on a second screen that points to the next step and asks for confirmation before moving on.

We built both as low-fidelity Figma prototypes and tested them with 6 older adults using think-aloud. The **Mentor won**: fewer mistakes, better efficiency, SUS 95.0, and it was preferred by the participants who struggled most. Confident users preferred the Gym — a useful signal for later.

## Prototype
We turned the Mentor into a high-fidelity, dual-screen prototype: the left screen is the service, the right screen is the assistant with short, friendly instructions ("Tap the white boxes to fill them in").

![Onboarding: the assistant introduces itself and lets the user enlarge the text](/assets/nipotyno/home_02.webp)

![CUP booking: the assistant explains how to fill in the form before the user starts](/assets/nipotyno/cup_03.webp)

![CUP booking: step-by-step guidance while entering the prescription code](/assets/nipotyno/cup_04.webp)

![pagoPA payment: the assistant shows where the QR code is on the paper bill](/assets/nipotyno/pa_02.webp)

One iteration came straight from testing: participants hesitated on text-only payment buttons, so we **replaced them with recognisable icons** (bank, card).

## Test
6 participants, remote sessions, realistic paper facsimiles (prescription, pagoPA bill, test card) so nobody had to invent data.

![Test material: a pagoPA bill facsimile with fictitious data used during the sessions](/assets/nipotyno/pagopa.webp)

| Metric | Result |
|---|---|
| Task success | **100%** (6/6 on both tasks) |
| SUS | **78.75** (Good; average is 68) |
| UEQ | All 6 scales **Good or Excellent** |
| Mistakes vs low-fi | **−10%** CUP booking · **−16%** pagoPA payment |

## Result
The concept held up in realistic conditions. One participant said the experience made her feel independent from her family and from public offices — exactly the goal of the project.

![pagoPA payment: summary screen before paying](/assets/nipotyno/pa_07.webp)

## What I'd change
- **Show format hints before errors happen:** the *codice fiscale* (tax code) field caused 8 of the mistakes of the two oldest participants.
- **Make every error recoverable:** a wrong email blocked one participant and needed the facilitator.
- **Differentiate payment methods more clearly:** 2 of 6 chose the wrong one at first.
- **Test with more 80+ users, in person:** recruiting this age group remotely was the biggest limitation.
