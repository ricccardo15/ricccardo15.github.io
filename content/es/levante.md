<!-- [CHECK] translation to review (ES: native speaker). Translated from content/levante.md on 21/10/2026, updated on 29/10/2026 (F2). -->
---
title: "Levante — Saber en pocas horas si el mar es seguro"
slug: levante
base: "Segunda base"
description: "Diseño de servicio y de dashboard para una boya con IA en el borde que detecta bacterias en aguas de baño. El concepto reduce el tiempo de confirmación de ~48 a ~3 horas. EIT Digital Summer School 2026, nota final 9/10."
og_image: /assets/levante/dashboard.webp
cover: /assets/levante/buoy-0.webp
tldr: "Hoy se tarda de 24 a 48 horas en confirmar que el agua de baño está contaminada. En un reto de una semana de EIT Digital, nuestro equipo de 6 diseñó Levante: una boya sensora solar con IA en el borde y un servicio de monitorización. Investigué la normativa y co-creé las personas y los journey maps. También diseñé el dashboard de monitorización."
stats: "~48 h → ~3 h (concepto) · equipo de 6 · nota 9/10"
role: "Diseñador UX y de servicio: diseñé el dashboard de monitorización (equipo de 6)"
team: "Equipo de 6"
context: "EIT Digital Summer School 2026 · ISEN Méditerranée, Francia · Reto 4 \"The Invisible Contamination\""
duration: "1 semana · jul 2026"
tools: "Desk research, personas, journey maps, diseño de interfaz de dashboard, business model canvas, pitch"
---

## En resumen {#tl-dr}
Cuando una playa está contaminada, la confirmación del laboratorio llega 24–48 horas después, cuando la gente ya se ha bañado. En un reto de una semana, nuestro equipo de 6 diseñó Levante: una boya solar con IA a bordo que predice la contaminación, más un dashboard para laboratorios y ayuntamientos. Con qPCR in situ, el concepto reduce la confirmación de **~48 a ~3 horas**. Yo diseñé el dashboard de monitorización.

## Mi rol
- Estudié la normativa europea sobre aguas de baño y cómo funciona la vigilancia en Italia, Francia y España.
- Con el equipo, creé las personas y los journey maps del personal de laboratorio, los técnicos de muestreo, los negocios de playa y las familias.
- Diseñé el dashboard de monitorización (mapa de riesgo, alertas por sector, estado del muestreo) y los renders de concepto de la boya.
- Desarrollamos juntos el modelo de negocio, y en el pitch final presenté el problema y las personas.

## El problema
El agua de baño se analiza tomando muestras y cultivando bacterias en un laboratorio, y el resultado tarda 24–48 horas. Italia, Francia y España analizan unas **73.000** muestras al año, todas con ese retraso. Las señales de alarma ya están en el agua, pero el resultado llega a la gente demasiado tarde para actuar.

**¿Cómo podríamos decirle a la gente si el agua es segura cuando todavía sirve de algo?**

## Investigación
Mapeamos a las personas que viven con ese retraso:
- Ping, una madre cuyos hijos enfermaron después de bañarse: *"Necesito saber cuanto antes si la playa es segura."*
- Para Gabriella, responsable de un laboratorio de calidad del agua, el muestreo y el análisis tardan demasiado y los experimentos son caros.
- Los técnicos de muestreo y los negocios de playa necesitan decisiones claras y tempranas.

![Persona: Ping, una madre que necesita saber rápido si el agua es segura (retrato generado con IA)](/assets/levante/persona-ping.webp)

![Persona: Gabriella, responsable de laboratorio que necesita resultados fiables y más rápidos (retrato generado con IA)](/assets/levante/persona-gabriela.webp)

## Ideas
Diseñamos un servicio alrededor del test de laboratorio. Los sensores de una boya miden turbidez, temperatura, conductividad y lluvia, y un modelo de IA en el borde estima el riesgo en el momento. Cuando el riesgo es alto, un equipo de campo comprueba el agua con qPCR y se actualiza el estado de la playa.

![Flujo del servicio: recogida de datos, detección del riesgo, alerta, verificación en campo, estado de la playa actualizado](/assets/levante/architecture.webp)

## Prototipo
Diseñé Tidewatch, el dashboard para laboratorios y ayuntamientos. Muestra los sectores y las alertas activas, un mapa de riesgo de la costa y un listado de alertas recientes con su estado de muestreo. El equipo ve de un vistazo adónde ir primero.

![Dashboard Tidewatch: sectores, alertas activas, mapa de riesgo y alertas recientes](/assets/levante/dashboard.webp)

![Render de concepto de la boya sensora solar y sus módulos](/assets/levante/buoy-0.webp)

## Modelo de negocio
Los ingresos vendrían de tarifas por el servicio de laboratorio, una suscripción al dashboard municipal y licencias de datos. Lo organizamos en un business model canvas circular.

![Business model canvas de Levante](/assets/levante/bmc.webp)

## Resultado
Presentamos Levante al jurado de la Summer School, y el proyecto obtuvo una **nota final de 9/10**.

## Qué cambiaría
- Probaría el dashboard con personal de laboratorio real. En una semana solo pudimos comprobarlo dentro del equipo.
- Diseñaría también la parte pública: un estado de la playa sencillo para familias como la de Ping, con un mapa, un color y la hora de la última actualización.
- El dashboard debería decir cuánta confianza tiene la predicción de la IA, para que nadie cierre una playa por una corazonada.
