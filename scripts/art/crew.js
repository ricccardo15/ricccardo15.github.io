// The other people on the field, 48×48 like the runner, one row each (order = CREW_ROWS in src/field-map.js):
//   coach (1st and 3rd base) · teammate A · teammate B (dugout) · pitcher (other team)
// Columns = frames: idle 0–1 · high five 2 · cheer 3–4 · pitch: set 5, wind-up 6, throw 7. (sheet 384×192)
// All original; same body as Riccardo (scripts/art/runner.js), with a cap instead of the helmet.
import { writeFile } from 'node:fs/promises';
import { canvas } from './canvas.js';
import { SIZE, legs, drawPlayer, sheetJson } from './runner.js';
import { CREW_ROWS } from '../../src/field-map.js';

const gear = (main, light, shade) => ({ main, light, shade });
const jersey = (main, light, shade) => ({ main, light, shade });

const LOOKS = {
  coach: {
    gear: gear('navy', 'navyMid', 'navyDark'), jersey: jersey('red', 'redLight', 'redDark'), number: 'white',
    pants: { main: 'grey', shade: 'greyDark', far: 'greyDark' },
  },
  mateA: {
    gear: gear('navy', 'navyMid', 'navyDark'), jersey: jersey('navy', 'navyMid', 'navyDark'), number: 'red', glove: 'white',
    pants: { main: 'white', shade: 'greyLight', far: 'skyLight' },
  },
  mateB: {
    gear: gear('red', 'redLight', 'redDark'), jersey: jersey('navy', 'navyMid', 'navyDark'), number: 'white', glove: 'white',
    skin: 'skinDark', skinShade: 'dirtDark',
    pants: { main: 'white', shade: 'greyLight', far: 'skyLight' },
  },
  pitcher: {
    gear: gear('grassDark', 'grass', 'black'), jersey: jersey('white', 'white', 'greyLight'), number: 'grassDark',
    pants: { main: 'white', shade: 'greyLight', far: 'grey' },
  },
};

const POSES = [
  { ...legs.stand, armBack: [[21, 23], [21, 27]], armFront: [[30, 23], [30, 27]], bob: 0 },
  { ...legs.stand, armBack: [[21, 24], [21, 29]], armFront: [[30, 24], [30, 29]], bob: 1 },
  // high five
  { ...legs.stand, armBack: [[21, 23], [21, 27]], armFront: [[35, 15], [39, 9]], bob: 0 },
  // cheer
  { ...legs.stand, armBack: [[15, 15], [9, 9]], armFront: [[35, 14], [38, 8]], bob: 0 },
  { ...legs.jump, armBack: [[15, 12], [9, 5]], armFront: [[35, 11], [38, 3]], bob: -2 },
  // pitch: set (hands together), wind-up (knee up, arm back), throw (stride, arm forward)
  { ...legs.stand, armBack: [[23, 24], [27, 23]], armFront: [[30, 24], [27, 23]], bob: 0 },
  { back: legs.stand.back, front: [[33, 30], [32, 38]], armBack: [[27, 23], [33, 21]], armFront: [[24, 14], [18, 8]], bob: -1 },
  { ...legs.wide, armBack: [[20, 23], [15, 26]], armFront: [[35, 21], [40, 26]], bob: 1 },
];
export const CREW_TAGS = [
  { name: 'idle', from: 0, to: 1, duration: 500 },
  { name: 'highfive', from: 2, to: 2, duration: 400 },
  { name: 'cheer', from: 3, to: 4, duration: 200 },
  { name: 'pitch', from: 5, to: 7, duration: 250 },
];

export async function crew(out) {
  const c = canvas(SIZE * POSES.length, SIZE * CREW_ROWS.length);
  CREW_ROWS.forEach((who, row) => {
    POSES.forEach((pose, i) => drawPlayer(c, i * SIZE, row * SIZE, pose, { helmet: false, stubble: false, ...LOOKS[who] }));
  });
  await c.png(out('crew.png'));
  await writeFile(out('crew.json'), sheetJson('crew', POSES.length, CREW_ROWS.length, CREW_TAGS));
}
