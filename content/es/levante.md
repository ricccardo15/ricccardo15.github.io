<!-- [CHECK] translation to review (ES: native speaker). Translated from content/levante.md on 21/10/2026. -->
---
title: "Levante — Saber en horas, no en días, si el mar es seguro"
slug: levante
base: "Segunda base"
description: "Diseño de servicio y de dashboard para una boya con IA en el borde que detecta bacterias en aguas de baño y reduce el tiempo de confirmación de ~48 a ~3 horas (concepto). EIT Digital Summer School 2026, nota final 9/10."
og_image: /assets/levante/dashboard.webp
cover: /assets/levante/buoy-0.webp
tldr: "Hoy se tarda de 24 a 48 horas en confirmar que el agua de baño está contaminada. En un reto de una semana de EIT Digital, nuestro equipo de 6 diseñó Levante: una boya sensora solar con IA en el borde y un servicio de monitorización. Investigué la normativa, co-creé personas y journeys y diseñé el dashboard de monitorización."
stats: "~48 h → ~3 h (concepto) · equipo de 6 · nota 9/10"
role: "Diseñador UX y de servicio: diseñé el dashboard de monitorización (equipo de 6)"
team: "Equipo de 6"
context: "EIT Digital Summer School 2026 · ISEN Méditerranée, Francia · Reto 4 \"The Invisible Contamination\""
duration: "1 semana · jul 2026"
tools: "Desk research, personas, user journeys, diseño de interfaz de dashboard, business model canvas, pitch"
---

## En resumen {#tl-dr}
Cuando una playa está contaminada, la confirmación del laboratorio llega **24–48 horas** después, cuando la gente ya se ha bañado. En un reto de una semana, nuestro equipo de 6 diseñó **Levante**: una boya solar con IA a bordo que predice la contaminación, más un dashboard para laboratorios y ayuntamientos. El concepto reduce la confirmación de **~48 a ~3 horas** con qPCR in situ. **Yo diseñé el dashboard de monitorización.**

## Mi rol
- **Investigación:** estudié la normativa europea sobre aguas de baño y cómo funciona la vigilancia en Italia, Francia y España.
- **Usuarios:** co-creé las personas y los user journeys (personal de laboratorio, técnicos de muestreo, negocios de playa, familias).
- **Diseño:** diseñé el **dashboard de monitorización** (mapa de riesgo, alertas por sector, estado del muestreo) y los renders de concepto de la boya.
- **Negocio y pitch:** desarrollé con el equipo el modelo de negocio y presenté el problema y las personas en el pitch final.

## El problema
El agua de baño se analiza tomando muestras y cultivando bacterias en un laboratorio: el resultado tarda 24–48 horas. Entre Italia, Francia y España se analizan unas **73.000** muestras al año, todas con ese retraso. La información está en el agua; simplemente no llega a nadie a tiempo.

**¿Cómo podríamos decirle a la gente si el agua es segura cuando todavía sirve de algo?**

## Investigación
Mapeamos a las personas que viven con ese retraso:
- **Ping**, una madre cuyos hijos enfermaron después de bañarse: *"Necesito saber cuanto antes si la playa es segura."*
- **Gabriella**, responsable de un laboratorio de calidad del agua: el muestreo y el análisis tardan demasiado y los experimentos son caros.
- Técnicos de muestreo y negocios de playa, que necesitan decisiones claras y tempranas.

![Persona: Ping, una madre que necesita saber rápido si el agua es segura (retrato generado con IA)](/assets/levante/persona-ping.webp)

![Persona: Gabriella, responsable de laboratorio que necesita resultados fiables y más rápidos (retrato generado con IA)](/assets/levante/persona-gabriela.webp)

## Ideas
En lugar de solo un test de laboratorio más rápido, diseñamos un **servicio**: los sensores de una boya miden turbidez, temperatura, conductividad y lluvia; un modelo de IA en el borde estima el riesgo en el momento; cuando el riesgo es alto, un equipo de campo lo verifica con qPCR y se actualiza el estado de la playa.

![Flujo del servicio: recogida de datos, detección del riesgo, alerta, verificación en campo, estado de la playa actualizado](/assets/levante/architecture.webp)

## Prototipo
Diseñé **Tidewatch**, el dashboard para laboratorios y ayuntamientos: una vista general de sectores y alertas activas, un **mapa de riesgo** de la costa y un listado de alertas recientes con su estado de muestreo, para que el equipo sepa adónde ir primero.

![Dashboard Tidewatch: sectores, alertas activas, mapa de riesgo y alertas recientes](/assets/levante/dashboard.webp)

![Render de concepto de la boya sensora solar y sus módulos](/assets/levante/buoy-0.webp)

## Modelo de negocio
Tarifas por el servicio de laboratorio, una suscripción al dashboard municipal y licencias de datos, organizados en un business model canvas circular.

![Business model canvas de Levante](/assets/levante/bmc.webp)

## Resultado
Presentamos Levante al jurado de la Summer School y el proyecto obtuvo una **nota final de 9/10**.

## Qué cambiaría
- **Probar el dashboard con personal de laboratorio real:** en una semana solo lo validamos dentro del equipo.
- **Diseñar la parte pública:** un estado de la playa sencillo para familias como la de Ping (mapa, color, última actualización).
- **Ser explícitos sobre la incertidumbre:** mostrar cuánta confianza tiene la predicción de la IA, para que nadie cierre una playa por una corazonada.
