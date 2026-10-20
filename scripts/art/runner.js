// Riccardo as a 32×32 pixel player, facing right, in 10 frames on one sprite sheet:
//   idle 0–1 · run 2–5 · swing 6–9   (same order as the tags in runner.json)
// Look taken from his reference photo (docs/reference/, private): navy helmet and jersey, dark curly hair,
// stubble, black earring, white pants and batting gloves, black wristbands. The photo itself is never used.
import { writeFile } from 'node:fs/promises';
import { canvas } from './canvas.js';

const SIZE = 32;

const HEAD = `
.....NNNNNN....
...NNNNNNNNNN..
..DNNNNNNNNNNN.
..DNNNNNNNNNNNN
..BBDSSSSSSS...
..BBSSSSSKSS...
..BsSSSSSSSSS..
..BKsSSSSSSS...
...sssssSss....
.....SSSS......`;
const HEAD_KEY = { N: 'navy', D: 'navyDark', B: 'black', S: 'skin', s: 'skinDark', K: 'black' };

const TORSO = `
..NNNNNN..
.NNNNNNNNN
.NNNNNNRNN
.NNNNNNNNN
.NNNNNNNNN
..NNNNNNN.
..KKKKKKK.
..WWWWWWW.`;
const TORSO_KEY = { N: 'navy', R: 'red', K: 'black', W: 'white' };

// A pose: knee/ankle of each leg, elbow/hand of each arm (sprite pixels), body bob, optional bat end.
const legs = {
  stand: { back: [[15, 23], [15, 28]], front: [[19, 23], [19, 28]] },
  wide: { back: [[13, 23], [11, 28]], front: [[21, 23], [23, 28]] },
};
const POSES = [
  // idle: standing, a small breath on the second frame
  { ...legs.stand, armBack: [[14, 15], [14, 18]], armFront: [[20, 15], [20, 18]], bob: 0 },
  { ...legs.stand, armBack: [[14, 16], [14, 19]], armFront: [[20, 16], [20, 19]], bob: 1 },
  // run: stride, pass, stride (other leg), pass
  { back: [[13, 23], [10, 26]], front: [[21, 23], [23, 28]], armBack: [[19, 15], [22, 13]], armFront: [[16, 15], [14, 17]], bob: 0 },
  { back: [[17, 22], [14, 25]], front: [[19, 24], [18, 28]], armBack: [[15, 16], [14, 18]], armFront: [[18, 16], [20, 17]], bob: -1 },
  { back: [[21, 23], [23, 28]], front: [[13, 23], [10, 26]], armBack: [[14, 15], [12, 17]], armFront: [[21, 15], [24, 13]], bob: 0 },
  { back: [[19, 24], [18, 28]], front: [[17, 22], [14, 25]], armBack: [[18, 16], [20, 17]], armFront: [[15, 16], [14, 18]], bob: -1 },
  // swing: stance, load, contact, follow-through
  { ...legs.wide, armBack: [[13, 15], [14, 12]], armFront: [[17, 15], [14, 12]], bat: [[14, 12], [9, 2]], bob: 0 },
  { ...legs.wide, armBack: [[12, 15], [12, 13]], armFront: [[16, 15], [12, 13]], bat: [[12, 13], [5, 5]], bob: 1 },
  { back: legs.wide.back, front: [[22, 23], [24, 28]], armBack: [[18, 15], [22, 16]], armFront: [[21, 15], [22, 16]], bat: [[19, 16], [30, 15]], bob: 0 },
  { ...legs.wide, armBack: [[17, 14], [13, 11]], armFront: [[19, 13], [13, 11]], bat: [[13, 11], [4, 15]], bob: 0 },
];
export const TAGS = [
  { name: 'idle', from: 0, to: 1, duration: 500 },
  { name: 'run', from: 2, to: 5, duration: 100 },
  { name: 'swing', from: 6, to: 9, duration: 110 },
];

function leg(c, ox, hip, [knee, ankle], color) {
  c.line(ox + hip[0], hip[1], ox + knee[0], knee[1], color, 3);
  c.line(ox + knee[0], knee[1], ox + ankle[0], ankle[1], color, 3);
  c.rect(ox + ankle[0] - 1, ankle[1] + 1, 4, 2, 'black'); // cleat, toe to the right
}

function arm(c, ox, shoulder, [elbow, hand]) {
  c.line(ox + shoulder[0], shoulder[1], ox + elbow[0], elbow[1], 'navy', 2);
  c.line(ox + elbow[0], elbow[1], ox + hand[0], hand[1], 'skin', 2);
  c.set(ox + hand[0], hand[1] - 1, 'black'); // wristband
  c.rect(ox + hand[0], hand[1], 2, 2, 'white'); // batting glove
}

function frame(c, i, pose) {
  const ox = i * SIZE;
  const b = pose.bob;
  arm(c, ox, [14, 12 + b], pose.armBack);
  leg(c, ox, [15, 19 + b], pose.back, 'skyLight'); // the far leg is in shadow
  c.map(ox + 11, 11 + b, TORSO, TORSO_KEY);
  leg(c, ox, [18, 19 + b], pose.front, 'white');
  c.map(ox + 8, 1 + b, HEAD, HEAD_KEY);
  if (pose.bat) {
    const [[x0, y0], [x1, y1]] = pose.bat;
    c.line(ox + x0, y0, ox + x1, y1, 'dirtDark', 2);
    c.set(ox + x1, y1, 'black'); // end cap
  }
  arm(c, ox, [19, 12 + b], pose.armFront);
  c.outline('navyDark', { x: ox, y: 0, w: SIZE, h: SIZE });
}

export async function runner(out) {
  const c = canvas(SIZE * POSES.length, SIZE);
  POSES.forEach((pose, i) => frame(c, i, pose));
  await c.png(out('runner.png'));

  // Aseprite-style JSON (array format): open runner.png + runner.json in Aseprite to edit the frames.
  const frames = POSES.map((_, i) => ({
    filename: `runner ${i}.aseprite`,
    frame: { x: i * SIZE, y: 0, w: SIZE, h: SIZE },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: SIZE, h: SIZE },
    sourceSize: { w: SIZE, h: SIZE },
    duration: TAGS.find((t) => i >= t.from && i <= t.to).duration,
  }));
  const json = {
    frames,
    meta: {
      app: 'scripts/art/runner.js',
      image: 'runner.png',
      format: 'RGBA8888',
      size: { w: SIZE * POSES.length, h: SIZE },
      scale: '1',
      frameTags: TAGS.map(({ name, from, to }) => ({ name, from, to, direction: 'forward' })),
    },
  };
  await writeFile(out('runner.json'), `${JSON.stringify(json, null, 2)}\n`);
}
