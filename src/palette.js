// The one 24-colour palette of all the pixel art (field, runner, crew, icons, title, Lab cover).
// 16 base colours + 8 added for the 480×270 art (Fase 1): light/dark tones for volume, wood and hair.
// The art scripts may only use these colours: tests/art.spec.js checks every PNG.
// navy + red match the UI colours in src/style.css.
export const PALETTE = {
  navy: '#1b2a4a',
  navyDark: '#0f1a30',
  red: '#b3261e',
  redLight: '#e0533f',
  white: '#ffffff',
  yellow: '#f2c14e',
  sky: '#8fd3ff',
  skyLight: '#c7ecff',
  grass: '#3f9b3a',
  grassDark: '#2f7d32',
  dirt: '#c98a4b',
  dirtDark: '#9c6334',
  skin: '#d9a07a',
  skinDark: '#a8704f',
  black: '#2a1d18',
  grey: '#8a94a6',
  // added in Fase 1 (480×270)
  grassLight: '#5db648',
  dirtLight: '#dca566',
  navyMid: '#2c4170',
  redDark: '#8a1c16',
  greyDark: '#5b6577',
  greyLight: '#b9c1cf',
  wood: '#7a4a28',
  hair: '#4a3426',
};
