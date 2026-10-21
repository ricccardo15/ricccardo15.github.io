<!-- [CHECK] translation to review (ES: native speaker). Translated from content/nipotyno.md on 21/10/2026. -->
---
title: "Nipotyno — Un mentor digital para personas mayores que usan servicios públicos"
slug: nipotyno
base: "Primera base"
description: "Investigación y diseño UX de un asistente guiado de doble pantalla que ayuda a las personas mayores a pedir citas médicas y pagar recibos públicos en línea. SUS 78,75, 100 % de tareas completadas."
og_image: /assets/nipotyno/home_05.webp
cover: /assets/nipotyno/home_05.webp
tldr: "En Italia, las personas mayores tienen que usar servicios públicos en línea que les generan estrés. Con un equipo de 4, investigué cómo se las arreglan, diseñamos dos conceptos alternativos y convertimos el ganador en un 'mentor digital' de doble pantalla. En las pruebas con 6 personas mayores, todas completaron las dos tareas; SUS 78,75 (Bueno)."
stats: "13 entrevistas · 6 participantes · SUS 78,75"
role: "Investigador y diseñador UX (equipo de 4)"
team: "Riccardo Cirillo, Fabio Vito Papapicco, Andrea Ramaglia Bianchino, Ilaria Salami"
context: "HCI Project — MSc Human-Computer Interaction and Design, Universidad Politécnica de Madrid"
duration: "feb – jun 2026"
tools: "Entrevistas, observación, personas, modelo de tareas, Figma, tests con pensamiento en voz alta, SUS, UEQ"
---

## En resumen {#tl-dr}
En Italia se empuja a las personas mayores a pedir citas médicas (CUP) y pagar recibos públicos (pagoPA) en línea, y muchas dependen de sus hijos para hacerlo. Con un equipo de 4, investigué cómo se las arreglan, diseñamos dos conceptos alternativos y convertimos el ganador en un "mentor digital" de doble pantalla. **6/6 participantes completaron las dos tareas · SUS 78,75 (Bueno) · las 6 escalas UEQ en Bueno o Excelente.**

## Mi rol
- **Investigación:** hice con el equipo las 13 entrevistas y las 5 observaciones, y las convertí en personas y en un modelo de tareas.
- **Baja fidelidad:** me encargué del **diseño visual** de los dos prototipos en Figma; moderé 2 de las 6 sesiones de test e hice de "ordenador" (Mago de Oz) en otras 2; analicé los datos de 2 participantes; escribí los capítulos de introducción y método.
- **Alta fidelidad:** construí el **flujo de reserva CUP** en Figma; escribí el protocolo del test (guion de bienvenida, proceso, consentimiento informado); moderé 2 sesiones y observé otras 2; hice el **análisis cuantitativo** (errores, tiempo, acciones).
- **Negocio:** escribí con el equipo el plan de negocio del concepto (asignatura Entrepreneurship and Business Modelling).

## El problema
CUP (*Centro Unico di Prenotazione*, el sistema regional para pedir citas médicas) y pagoPA (la plataforma nacional para pagar a las administraciones públicas) son obligatorios para muchas tareas cotidianas. Para las personas de más de 70 años son una fuente de ansiedad: formularios densos, lenguaje técnico y miedo a cometer un error irreversible. Muchas simplemente se lo delegan a la familia.

**¿Cómo podríamos ayudar a las personas mayores a completar estas tareas por sí solas, sin miedo a "romper" algo?**

## Investigación
Entrevistamos a 13 personas y observamos a 5 de ellas mientras intentaban tareas reales. Tres patrones de comportamiento marcaron todo lo que vino después:
- **Apaño híbrido:** mezclar papel, llamadas y una persona que ayuda para sacar adelante una tarea digital.
- **Silo de memoria:** memorizar una secuencia exacta de toques; cualquier cambio la rompe.
- **Búsqueda de un refugio seguro:** buscar a una persona o un lugar conocido que confirme cada paso.

Lo que necesitaban no era un tutorial mejor, sino **un segundo par de ojos** que confirme cada paso.

![Mapa de navegación del prototipo de alta fidelidad: bienvenida, menú principal, flujos CUP y pagoPA](/assets/nipotyno/navigation-map.webp)

## Ideas: dos conceptos en competencia
- **A · Digital Gym:** aprender haciendo: una lección corta y luego prueba y error libre con respuesta inmediata.
- **B · Interactive Mentor:** dos pantallas coordinadas: el servicio en el móvil y un "mentor" en una segunda pantalla que señala el siguiente paso y pide confirmación antes de seguir.

Construimos los dos como prototipos de baja fidelidad en Figma y los probamos con 6 personas mayores pensando en voz alta. **Ganó el Mentor**: menos errores, más eficiencia, SUS 95,0, y lo prefirieron quienes más dificultades tenían. Los usuarios con más confianza preferían el Gym, una señal útil para más adelante.

## Prototipo
Convertimos el Mentor en un prototipo de alta fidelidad de doble pantalla: a la izquierda el servicio, a la derecha el asistente con instrucciones cortas y amables ("Toca los recuadros blancos para rellenarlos").

![Bienvenida: el asistente se presenta y permite agrandar el texto](/assets/nipotyno/home_02.webp)

![Reserva CUP: el asistente explica cómo rellenar el formulario antes de empezar](/assets/nipotyno/cup_03.webp)

![Reserva CUP: guía paso a paso al introducir el código de la receta](/assets/nipotyno/cup_04.webp)

![Pago con pagoPA: el asistente muestra dónde está el código QR en el recibo de papel](/assets/nipotyno/pa_02.webp)

Una iteración salió directamente de los tests: los participantes dudaban ante botones de pago con solo texto, así que **los sustituimos por iconos reconocibles** (banco, tarjeta).

## Test
6 participantes, sesiones en remoto y facsímiles de papel realistas (receta, recibo pagoPA, tarjeta de prueba) para que nadie tuviera que inventarse datos.

![Material del test: un facsímil de recibo pagoPA con datos ficticios usado en las sesiones](/assets/nipotyno/pagopa.webp)

| Métrica | Resultado |
|---|---|
| Tareas completadas | **100 %** (6/6 en las dos tareas) |
| SUS | **78,75** (Bueno; la media es 68) |
| UEQ | Las 6 escalas en **Bueno o Excelente** |
| Errores frente a baja fidelidad | **−10 %** reserva CUP · **−16 %** pago pagoPA |

## Resultado
El concepto funcionó en condiciones realistas. Una participante dijo que la experiencia la hacía sentirse independiente de su familia y de las oficinas públicas: justo el objetivo del proyecto.

![Pago con pagoPA: pantalla de resumen antes de pagar](/assets/nipotyno/pa_07.webp)

## Qué cambiaría
- **Mostrar el formato antes de que aparezca el error:** el campo del *codice fiscale* (código fiscal) causó 8 de los errores de los dos participantes de más edad.
- **Que todo error tenga arreglo:** un email equivocado bloqueó a un participante y necesitó al moderador.
- **Diferenciar mejor los métodos de pago:** 2 de 6 eligieron primero el equivocado.
- **Probar con más usuarios de más de 80 años, en persona:** reclutar a esta franja de edad en remoto fue la mayor limitación.
