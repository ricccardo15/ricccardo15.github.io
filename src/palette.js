// The one palette of all the pixel art (field, night field, runner, crew, icons, title, Sensor lab cover): 34 colours.
// 16 base colours + 8 added for the 480×270 art (Fase 1) + 10 for the colour ramps and the night sky (F6).
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
  // added in F6: the ends of four 5-tone ramps (shadows lean blue/purple, lights lean yellow) + the night sky
  redDeep: '#5a1238',
  redPeach: '#f5925a',
  navyLight: '#4a6aa0',
  navyPale: '#8fb0d8',
  grassDeep: '#1f5a4a',
  grassPale: '#a8d65a',
  skinDeep: '#5e3a3a',
  skinLight: '#eebd92',
  skinPale: '#f8dcb4',
  night: '#0b0f1e',
};

// The ramps, darkest first (F6). The darkest tone of a ramp is the outline of the parts painted with that ramp
// (scripts/art/canvas.js, outlineByRamp): never pure black, and one step lighter on the lit side (top left).
export const RAMPS = {
  red: ['redDeep', 'redDark', 'red', 'redLight', 'redPeach'],
  navy: ['navyDark', 'navy', 'navyMid', 'navyLight', 'navyPale'],
  grass: ['grassDeep', 'grassDark', 'grass', 'grassLight', 'grassPale'],
  skin: ['skinDeep', 'skinDark', 'skin', 'skinLight', 'skinPale'],
};
