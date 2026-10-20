---
title: "Levante — Knowing in hours, not days, if the sea is safe"
slug: levante
base: "2nd base"
description: "Service and dashboard design for an edge-AI buoy that detects bacteria in bathing water, cutting confirmation time from ~48 to ~3 hours (concept). EIT Digital Summer School 2026, final grade 9/10."
og_image: /assets/levante/dashboard.webp
cover: /assets/levante/buoy-0.webp
tldr: "Today it takes 24–48 hours to confirm that bathing water is contaminated. In a one-week EIT Digital challenge, our team of 6 designed Levante: a solar-powered sensing buoy with edge AI plus a monitoring service. I researched the rules, co-created personas and journeys, and designed the monitoring dashboard."
role: "UX & service designer — designed the monitoring dashboard (team of 6)"
team: "Team of 6"
context: "EIT Digital Summer School 2026 · ISEN Méditerranée, France · Challenge 4 \"The Invisible Contamination\""
duration: "1 week · Jul 2026"
tools: "Desk research, personas, user journeys, dashboard UI design, business model canvas, pitch"
---

<!-- Sources: final slides, pitch script, personas, CV text approved on 18/10. Persona portraits are AI-generated. Final grade 9 (confirmed by Riccardo 20/10). -->

## TL;DR
When a beach is contaminated, lab confirmation arrives **24–48 hours** later — after people have already swum. In a one-week challenge our team of 6 designed **Levante**: a solar-powered buoy with on-board AI that predicts contamination, plus a dashboard for labs and municipalities. The concept cuts confirmation from **~48 to ~3 hours** with on-site qPCR. **I designed the monitoring dashboard.**

## My role
- **Research:** studied EU bathing-water rules and how monitoring works in Italy, France and Spain.
- **Users:** co-created the personas and user journeys (lab staff, field samplers, beach businesses, families).
- **Design:** designed the **monitoring dashboard** (risk map, sector alerts, sampling status) and the concept renders of the buoy.
- **Business & pitch:** co-developed the business model and presented the problem and the personas in the final pitch.

## The problem
Bathing water is tested by taking samples and growing bacteria in a lab: the result takes 24–48 hours. Across Italy, France and Spain about **73,000** samples are tested every year, each with that delay. The information exists in the water — it just doesn't reach anyone in time.

**How might we tell people whether the water is safe while it still matters?**

## Research
We mapped the people who live with that delay:
- **Ping**, a mother whose children got sick after swimming: *"I need to know if the beach is safe as soon as possible."*
- **Gabriella**, a water-quality lab manager: sampling and analysis take too long and experiments are costly.
- Field samplers and beach businesses, who need clear, early decisions.

![Persona: Ping, a mother who needs to know quickly if the water is safe (AI-generated portrait)](/assets/levante/persona-ping.webp)

![Persona: Gabriella, a lab manager who needs reliable, faster results (AI-generated portrait)](/assets/levante/persona-gabriella.webp)

## Ideas
Instead of a faster lab test alone, we designed a **service**: sensors on a buoy measure turbidity, temperature, conductivity and rainfall; an edge-AI model estimates the risk on the spot; when risk is high, a field team verifies with qPCR and the beach status is updated.

![Service flow: data collection, risk detection, alert, field verification, beach status updated](/assets/levante/architecture.webp)

## Prototype
I designed **Tidewatch**, the dashboard for labs and municipalities: an overview of sectors and active alerts, a **risk map** of the coast, and a feed of recent alerts with their sampling status, so the team knows where to go first.

![Tidewatch dashboard: sectors, active alerts, risk map and recent alerts](/assets/levante/dashboard.webp)

![Concept render of the solar-powered sensing buoy and its modules](/assets/levante/buoy-0.webp)

## Business model
Lab service fees, a subscription to the municipal dashboard and data licensing, mapped on a circular business model canvas.

![Business model canvas of Levante](/assets/levante/bmc.webp)

## Result
We pitched Levante to the Summer School jury and the project received a **final grade of 9/10**.

## What I'd change
- **Test the dashboard with real lab staff:** in one week we validated it only inside the team.
- **Design the public side:** a simple beach status for families like Ping (map, colour, last update).
- **Be explicit about uncertainty:** show how confident the AI prediction is, so nobody closes a beach on a guess.
