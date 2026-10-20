// Shared map of the ballpark, in field pixels (the field image is 320×180).
// Used by scripts/field.js (draws the image), scripts/pages.js (places the base links)
// and src/diamond.js (moves the runner). Change a position here and everything follows.
export const FIELD = { width: 320, height: 180 };

// Stops in keyboard order (← →). `id` = case page slug (/nipotyno/); home has no page of its own.
export const STOPS = [
  { id: 'home', x: 160, y: 158, label: 'Home plate', name: 'Start here' },
  { id: 'nipotyno', x: 222, y: 112, label: '1st base', name: 'Nipotyno' },
  { id: 'levante', x: 160, y: 66, label: '2nd base', name: 'Levante' },
  { id: 'housing', x: 98, y: 112, label: '3rd base', name: 'Housing' },
  { id: 'lab', x: 36, y: 150, label: 'Dugout', name: 'Lab' },
];

// The runner follows the base path (home → 1st → 2nd → 3rd → home); the dugout is reached from home.
export const RING = ['home', 'nipotyno', 'levante', 'housing'];
