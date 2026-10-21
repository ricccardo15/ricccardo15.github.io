// The few sentences of the game (status messages, tour buttons, the reader's way back) in the page's language.
// scripts/pages.js writes them on #field as data-strings (from src/i18n.js), so the JavaScript has no text of its own.
const raw = document.querySelector('#field')?.dataset.strings;
export const T = raw ? JSON.parse(raw) : {};
// "Next base: {name}" → "Next base: Levante"
export const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, key) => values[key]);
