// Shared map of the ballpark, in field pixels (the field image is 480×270).
// Used by scripts/art/field.js (draws the image), scripts/pages.js (places the base links)
// and src/game.js (moves the runner). Change a position here and everything follows.
// On a phone the 480 px wide field is cropped to the screen (about 64 px off each side): every point a visitor can
// click must stay between x = 64 and x = 416 (tests/field.spec.js checks it).
export const FIELD = { width: 480, height: 270 };
export const SAFE = { left: 64, right: 416 };

// Stops in keyboard order (← →). `id` = case page slug (/nipotyno/); home has no page of its own.
// `tag` = where the label sits, so it never hides the runner standing on the base (or the pitcher): below / right / above.
export const STOPS = [
  { id: 'home', x: 240, y: 237, label: 'Home plate', name: 'Start here', tag: 'right' },
  { id: 'nipotyno', x: 333, y: 168, label: '1st base', name: 'Nipotyno', tag: 'below' },
  { id: 'levante', x: 240, y: 99, label: '2nd base', name: 'Levante', tag: 'right' },
  { id: 'sensor-lab', x: 147, y: 168, label: '3rd base', name: 'Sensor lab', tag: 'below' },
];

// The dugout is only scenery (F1): the runner comes out of it when the visitor enters the ballpark (src/game.js).
export const DUGOUT = { x: 110, y: 225 };

// Other points a visitor can click (Fase 2). Separate from STOPS and RING: the runner's path and ← → do not change.
// They open a card over the stadium; without JS they are links to the sections of the page (`href`).
// `tag` as for STOPS ('upleft' = above and to the left of the point). Their icons follow the 4 of STOPS in icons.png.
export const SPOTS = [
  { id: 'about', x: 240, y: 30, label: 'Scoreboard', name: 'About', tag: 'below', href: '#about' },
  { id: 'how', x: 240, y: 168, label: "Pitcher's mound", name: 'How I design', tag: 'upleft', href: '#how' },
  { id: 'contact', x: 360, y: 40, label: 'Ticket booth', name: 'Contact & CV', tag: 'below', href: '#contact' },
];

// The runner follows the base path (home → 1st → 2nd → 3rd → home).
export const RING = ['home', 'nipotyno', 'levante', 'sensor-lab'];

// People on the field (scripts/art/crew.js draws one row each, in this order). x/y = feet, in field pixels.
// `flip` = faces left. Teammates stand in front of the dugout (which sits at x = 110 so it is inside the phone crop).
export const CREW_ROWS = ['coach', 'mateA', 'mateB', 'pitcher'];
export const CREW = [
  { id: 'coach1', who: 'coach', x: 366, y: 171, flip: true },
  { id: 'coach3', who: 'coach', x: 117, y: 171 }, // hand meets the runner's on 3rd
  { id: 'pitcher', who: 'pitcher', x: 240, y: 171, flip: true },
  { id: 'mateA', who: 'mateA', x: 80, y: 241 },
  { id: 'mateB', who: 'mateB', x: 140, y: 241, flip: true },
];

// The home-run tour: one stop per project, each with a small moment (src/tour.js), then the last card.
// `moment` = runner animation, `with` = who joins in (crew ids) and how, `corner` = the corner of the tour diamond.
// The tour never moves on by itself: the visitor presses Next in the card.
export const TOUR = [
  { stop: 'nipotyno', corner: 'first', moment: 'highfive', with: { coach1: 'highfive' } },
  { stop: 'levante', corner: 'second', moment: 'cheer', with: {} },
  { stop: 'sensor-lab', corner: 'third', moment: 'highfive', with: { coach3: 'highfive' } },
  { stop: 'home', corner: 'home', panel: 'done' }, // back on home plate, last card: CV, email, take another swing
];
