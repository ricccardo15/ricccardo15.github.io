// The other people on the field, 32×32 like the runner, one row each (order = CREW_ROWS in src/field-map.js):
//   coach (1st and 3rd base) · teammate A · teammate B (dugout) · pitcher (other team)
// Columns = frames: idle 0–1 · high five 2 · cheer 3–4 · pitch: set 5, wind-up 6, throw 7.
// All original; same body as Riccardo (scripts/art/runner.js), with a cap instead of the helmet.
import { writeFile } from 'node:fs/promises';
import { canvas } from './canvas.js';
import { SIZE, legs, drawPlayer, torsoKey, sheetJson } from './runner.js';
import { CREW_ROWS } from '../../src/field-map.js';

const CAP = `
...............
....CCCCCC.....
...CCCCCCCC....
...CCCCCCCCCC..
..BBSSSSSSS....
..BBSSSSSKSS...
..BsSSSSSSSSS..
..BKsSSSSSSS...
...sssssSss....
.....SSSS......`;
const capKey = (cap, skin = 'skin', shade = 'skinDark') => ({ C: cap, B: 'black', S: skin, s: shade, K: 'black' });

const LOOKS = {
  coach: { headKey: capKey('navy'), torso: torsoKey('red', 'white', 'grey'), sleeve: 'red', pants: ['grey', 'grey'] },
  mateA: { headKey: capKey('navy'), torso: torsoKey('navy', 'red'), sleeve: 'navy', glove: 'white', pants: ['skyLight', 'white'] },
  mateB: { headKey: capKey('red', 'skinDark', 'dirtDark'), torso: torsoKey('navy', 'white'), sleeve: 'navy', skin: 'skinDark', glove: 'white', pants: ['skyLight', 'white'] },
  pitcher: { headKey: capKey('grassDark'), torso: torsoKey('white', 'grassDark', 'white'), sleeve: 'white', pants: ['grey', 'white'] },
};

const POSES = [
  { ...legs.stand, armBack: [[14, 15], [14, 18]], armFront: [[20, 15], [20, 18]], bob: 0 },
  { ...legs.stand, armBack: [[14, 16], [14, 19]], armFront: [[20, 16], [20, 19]], bob: 1 },
  // high five
  { ...legs.stand, armBack: [[14, 15], [14, 18]], armFront: [[23, 10], [26, 6]], bob: 0 },
  // cheer
  { ...legs.stand, armBack: [[10, 10], [6, 6]], armFront: [[23, 9], [25, 5]], bob: 0 },
  { ...legs.jump, armBack: [[10, 8], [6, 3]], armFront: [[23, 7], [25, 2]], bob: -2 },
  // pitch: set (hands together), wind-up (knee up, arm back), throw (stride, arm forward)
  { ...legs.stand, armBack: [[15, 16], [18, 15]], armFront: [[20, 16], [18, 15]], bob: 0 },
  { back: legs.stand.back, front: [[22, 20], [21, 25]], armBack: [[18, 15], [22, 14]], armFront: [[16, 9], [12, 5]], bob: -1 },
  { ...legs.wide, armBack: [[13, 15], [10, 17]], armFront: [[23, 14], [27, 17]], bob: 1 },
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
    const look = { head: CAP, ...LOOKS[who] };
    POSES.forEach((pose, i) => drawPlayer(c, i * SIZE, row * SIZE, pose, look));
  });
  await c.png(out('crew.png'));
  await writeFile(out('crew.json'), sheetJson('crew', POSES.length, CREW_ROWS.length, CREW_TAGS));
}
