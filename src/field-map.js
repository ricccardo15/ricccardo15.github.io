// Shared map of the ballpark, in field pixels (the field image is 320×180).
// Used by scripts/field.js (draws the image), scripts/pages.js (places the base links)
// and src/diamond.js (moves the runner). Change a position here and everything follows.
export const FIELD = { width: 320, height: 180 };

// Stops in keyboard order (← →). `id` = case page slug (/nipotyno/); home has no page of its own.
// `tag` = where the label sits, so it never hides the runner standing on the base (or the pitcher): below / right / above.
export const STOPS = [
  { id: 'home', x: 160, y: 158, label: 'Home plate', name: 'Start here', tag: 'right' },
  { id: 'nipotyno', x: 222, y: 112, label: '1st base', name: 'Nipotyno', tag: 'below' },
  { id: 'levante', x: 160, y: 66, label: '2nd base', name: 'Levante', tag: 'right' },
  { id: 'housing', x: 98, y: 112, label: '3rd base', name: 'Housing', tag: 'below' },
  { id: 'lab', x: 36, y: 150, label: 'Dugout', name: 'Lab', tag: 'above' },
];

// The runner follows the base path (home → 1st → 2nd → 3rd → home); the dugout is reached from home.
export const RING = ['home', 'nipotyno', 'levante', 'housing'];

// People on the field (scripts/art/crew.js draws one row each, in this order). x/y = feet, in field pixels.
// `flip` = faces left. Teammates stand in front of the dugout.
export const CREW_ROWS = ['coach', 'mateA', 'mateB', 'pitcher'];
export const CREW = [
  { id: 'coach1', who: 'coach', x: 244, y: 114, flip: true },
  { id: 'coach3', who: 'coach', x: 78, y: 114 }, // hand meets the runner's on 3rd
  { id: 'pitcher', who: 'pitcher', x: 160, y: 114, flip: true },
  { id: 'mateA', who: 'mateA', x: 12, y: 160 },
  { id: 'mateB', who: 'mateB', x: 60, y: 160, flip: true },
];

// The home-run tour: one stop per project, each with a small moment (src/diamond.js), then the last card.
// `moment` = runner animation, `with` = who joins in (crew ids) and how.
export const TOUR = [
  { stop: 'nipotyno', moment: 'highfive', with: { coach1: 'highfive' } },
  { stop: 'levante', moment: 'cheer', with: {} },
  { stop: 'housing', moment: 'highfive', with: { coach3: 'highfive' } },
  { stop: 'lab', moment: 'wave', with: { mateA: 'cheer', mateB: 'cheer' } },
  { stop: 'lab', panel: 'done' }, // last card: CV, email, take another swing
];
