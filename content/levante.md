---
title: "Levante — Knowing within hours if the sea is safe"
slug: levante
base: "2nd base"
description: "Service and dashboard design for an edge-AI buoy that detects bacteria in bathing water. The concept cuts confirmation time from ~48 to ~3 hours. EIT Digital Summer School 2026, final grade 9/10."
og_image: /assets/levante/dashboard.webp
cover: /assets/levante/buoy-0.webp
tldr: "Today it takes 24–48 hours to confirm that bathing water is contaminated. In a one-week EIT Digital challenge, our team of 6 designed Levante: a solar-powered sensing buoy with edge AI plus a monitoring service. I researched the rules and co-created the personas and journey maps. I also designed the monitoring dashboard."
stats: "~48 h → ~3 h (concept) · team of 6 · grade 9/10"
role: "UX & service designer: I designed the monitoring dashboard (team of 6)"
team: "Team of 6"
context: "EIT Digital Summer School 2026 · ISEN Méditerranée, France · Challenge 4 \"The Invisible Contamination\""
duration: "1 week · Jul 2026"
tools: "Desk research, personas, journey maps, dashboard UI design, business model canvas, pitch"
---

<!-- Sources: final slides, pitch script, personas, CV text approved on 18/10. Persona portraits are AI-generated. Final grade 9 (confirmed by Riccardo 20/10). -->

## TL;DR {#tl-dr}
When a beach is contaminated, lab confirmation arrives 24–48 hours later, after people have already been swimming. In a one-week challenge our team of 6 designed Levante: a solar-powered buoy with on-board AI that predicts contamination, plus a dashboard for labs and municipalities. With on-site qPCR, the concept cuts confirmation from **~48 to ~3 hours**. I designed the monitoring dashboard.

## My role
- I studied the EU bathing-water rules and how monitoring works in Italy, France and Spain.
- With the team, I created the personas and journey maps for lab staff, field samplers, beach businesses and families.
- I designed the monitoring dashboard (risk map, sector alerts, sampling status) and the concept renders of the buoy.
- We worked out the business model together, and in the final pitch I presented the problem and the personas.

## The problem
Bathing water is tested by taking samples and growing bacteria in a lab, and the result takes 24–48 hours. Italy, France and Spain test about **73,000** samples a year, each with that delay. The warning signs are already in the water, but the result reaches people too late to act on it.

**How might we tell people whether the water is safe while it still matters?**

## Research
We mapped the people who live with that delay:
- Ping, a mother whose children got sick after swimming: *"I need to know if the beach is safe as soon as possible."*
- Gabriella, a water-quality lab manager, finds that sampling and analysis take too long and experiments are costly.
- Field samplers and beach businesses need clear decisions, early.

![Persona: Ping, a mother who needs to know quickly if the water is safe (AI-generated portrait)](/assets/levante/persona-ping.webp)

![Persona: Gabriella, a lab manager who needs reliable, faster results (AI-generated portrait)](/assets/levante/persona-gabriela.webp)

## Ideas
We designed a service around the lab test. Sensors on a buoy measure turbidity, temperature, conductivity and rainfall, and an edge-AI model estimates the risk on the spot. When the risk is high, a field team checks the water with qPCR and the beach status is updated.

![Service flow: data collection, risk detection, alert, field verification, beach status updated](/assets/levante/architecture.webp)

## Prototype
I designed Tidewatch, the dashboard for labs and municipalities. It shows the sectors and active alerts, a risk map of the coast and a feed of recent alerts with their sampling status. The team can see at a glance where to go first.

![Tidewatch dashboard: sectors, active alerts, risk map and recent alerts](/assets/levante/dashboard.webp)

![Concept render of the solar-powered sensing buoy and its modules](/assets/levante/buoy-0.webp)

## Business model
Revenue would come from lab service fees, a subscription to the municipal dashboard and data licensing. We mapped it on a circular business model canvas.

![Business model canvas of Levante](/assets/levante/bmc.webp)

## Result
We pitched Levante to the Summer School jury, and the project got a **final grade of 9/10**.

## What I'd change
- I'd test the dashboard with real lab staff. In one week we could only check it inside the team.
- I'd design the public side too: a simple beach status for families like Ping, with a map, a colour and the time of the last update.
- The dashboard should say how confident the AI prediction is, so nobody closes a beach on a guess.
