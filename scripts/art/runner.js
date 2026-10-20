// Riccardo as a 32×32 pixel player, facing right, in 15 frames on one sprite sheet:
//   idle 0–1 · run 2–5 · swing 6–9 · high five 10 · cheer 11–12 · wave 13–14   (same order as the tags in runner.json)
// One row per uniform (src/uniforms.js): Researcher, Designer, Maker = palette swap + accessory.
// Look taken from his reference photo (docs/reference/, private): navy helmet and jersey, dark curly hair,
// stubble, black earring, white pants and batting gloves, black wristbands. The photo itself is never used.
// drawPlayer() is shared with scripts/art/crew.js (coaches, teammates, pitcher).
import { writeFile } from 'node:fs/promises';
import { canvas } from './canvas.js';
import { UNIFORMS } from '../../src/uniforms.js';

export const SIZE = 32;

export const HEAD = `
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
const headKey = (u) => ({ N: u.colors.helmet, D: u.colors.helmetShade, B: 'black', S: 'skin', s: 'skinDark', K: 'black' });

const TORSO = `
..NNNNNN..
.NNNNNNNNN
.NNNNNNRNN
.NNNNNNNNN
.NNNNNNNNN
..NNNNNNN.
..KKKKKKK.
..WWWWWWW.`;
export const torsoKey = (jersey, number, pants = 'white') => ({ N: jersey, R: number, K: 'black', W: pants });

// A pose: knee/ankle of each leg, elbow/hand of each arm (sprite pixels), body bob, optional bat end.
// `prop: false` = hands busy (high five, cheer, wave): no lens or wrench in the hand.
export const legs = {
  stand: { back: [[15, 23], [15, 28]], front: [[19, 23], [19, 28]] },
  wide: { back: [[13, 23], [11, 28]], front: [[21, 23], [23, 28]] },
  jump: { back: [[14, 22], [13, 26]], front: [[20, 22], [21, 26]] },
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
  // high five: front hand up and forward
  { ...legs.stand, armBack: [[14, 15], [14, 18]], armFront: [[23, 10], [26, 6]], bob: 0, prop: false },
  // cheer: both arms up, then a little jump
  { ...legs.stand, armBack: [[10, 10], [6, 6]], armFront: [[23, 9], [25, 5]], bob: 0, prop: false },
  { ...legs.jump, armBack: [[10, 8], [6, 3]], armFront: [[23, 7], [25, 2]], bob: -2, prop: false },
  // wave: front hand up, then out to the side
  { ...legs.stand, armBack: [[14, 15], [14, 18]], armFront: [[22, 10], [22, 6]], bob: 0, prop: false },
  { ...legs.stand, armBack: [[14, 15], [14, 18]], armFront: [[22, 10], [25, 7]], bob: 0, prop: false },
];
export const TAGS = [
  { name: 'idle', from: 0, to: 1, duration: 500 },
  { name: 'run', from: 2, to: 5, duration: 100 },
  { name: 'swing', from: 6, to: 9, duration: 110 },
  { name: 'highfive', from: 10, to: 10, duration: 400 },
  { name: 'cheer', from: 11, to: 12, duration: 200 },
  { name: 'wave', from: 13, to: 14, duration: 250 },
];

function leg(c, ox, oy, hip, [knee, ankle], color) {
  c.line(ox + hip[0], oy + hip[1], ox + knee[0], oy + knee[1], color, 3);
  c.line(ox + knee[0], oy + knee[1], ox + ankle[0], oy + ankle[1], color, 3);
  c.rect(ox + ankle[0] - 1, oy + ankle[1] + 1, 4, 2, 'black'); // cleat, toe to the right
}

function arm(c, ox, oy, shoulder, [elbow, hand], { sleeve, skin, glove }) {
  c.line(ox + shoulder[0], oy + shoulder[1], ox + elbow[0], oy + elbow[1], sleeve, 2);
  c.line(ox + elbow[0], oy + elbow[1], ox + hand[0], oy + hand[1], skin, 2);
  if (glove) {
    c.set(ox + hand[0], oy + hand[1] - 1, 'black'); // wristband
    c.rect(ox + hand[0], oy + hand[1], 2, 2, glove); // batting glove
  }
}

// Accessory of the uniform, shown when the hands are free (idle and run frames); the pencil always shows.
function accessory(c, ox, oy, b, [hx, hy], kind) {
  if (kind === 'lens') { // magnifying glass held up in the front hand
    c.line(ox + hx + 1, oy + hy, ox + hx + 2, oy + hy - 2, 'black');
    c.rect(ox + hx + 1, oy + hy - 7, 5, 5, 'grey');
    c.rect(ox + hx + 2, oy + hy - 6, 3, 3, 'skyLight');
  } else if (kind === 'wrench') { // wrench in the front hand
    c.line(ox + hx + 1, oy + hy, ox + hx + 3, oy + hy - 4, 'grey', 2);
    c.rect(ox + hx + 2, oy + hy - 7, 4, 2, 'grey');
    c.set(ox + hx + 3, oy + hy - 7, 'skyLight'); // open jaw
  } else if (kind === 'pencil') { // yellow pencil behind the ear
    c.line(ox + 8, oy + b + 8, ox + 11, oy + b + 5, 'yellow');
    c.set(ox + 7, oy + b + 9, 'black'); // tip
    c.set(ox + 12, oy + b + 4, 'redLight'); // eraser
  }
}

// One player in one 32×32 cell. `look`: head map + key, torso key, arm colours, pants (far leg, near leg).
export function drawPlayer(c, ox, oy, pose, look) {
  const b = pose.bob;
  const arms = { sleeve: look.sleeve, skin: look.skin ?? 'skin', glove: look.glove };
  arm(c, ox, oy, [14, 12 + b], pose.armBack, arms);
  leg(c, ox, oy, [15, 19 + b], pose.back, look.pants[0]); // the far leg is in shadow
  c.map(ox + 11, oy + 11 + b, TORSO, look.torso);
  leg(c, ox, oy, [18, 19 + b], pose.front, look.pants[1]);
  c.map(ox + 8, oy + 1 + b, look.head, look.headKey);
  if (pose.bat) {
    const [[x0, y0], [x1, y1]] = pose.bat;
    c.line(ox + x0, oy + y0, ox + x1, oy + y1, 'dirtDark', 2);
    c.set(ox + x1, oy + y1, 'black'); // end cap
  }
  arm(c, ox, oy, [19, 12 + b], pose.armFront, arms);
  if (look.accessory === 'pencil' || (look.accessory && !pose.bat && pose.prop !== false)) {
    accessory(c, ox, oy, b, pose.armFront[1], look.accessory);
  }
  c.outline('navyDark', { x: ox, y: oy, w: SIZE, h: SIZE });
}

// Aseprite-style JSON (array format) for a sheet: open the PNG + JSON in Aseprite to edit the frames.
export function sheetJson(name, columns, rows, tags) {
  const frames = Array.from({ length: columns }, (_, i) => ({
    filename: `${name} ${i}.aseprite`,
    frame: { x: i * SIZE, y: 0, w: SIZE, h: SIZE },
    rotated: false,
    trimmed: false,
    spriteSourceSize: { x: 0, y: 0, w: SIZE, h: SIZE },
    sourceSize: { w: SIZE, h: SIZE },
    duration: tags.find((t) => i >= t.from && i <= t.to).duration,
  }));
  const json = {
    frames,
    meta: {
      app: `scripts/art/${name}.js`,
      image: `${name}.png`,
      format: 'RGBA8888',
      size: { w: SIZE * columns, h: SIZE * rows },
      scale: '1',
      frameTags: tags.map(({ name: tag, from, to }) => ({ name: tag, from, to, direction: 'forward' })),
    },
  };
  return `${JSON.stringify(json, null, 2)}\n`;
}

export async function runner(out) {
  const c = canvas(SIZE * POSES.length, SIZE * UNIFORMS.length);
  for (const u of UNIFORMS) {
    const look = {
      head: HEAD,
      headKey: headKey(u),
      torso: torsoKey(u.colors.jersey, u.colors.number),
      sleeve: u.colors.jersey,
      glove: 'white',
      pants: ['skyLight', 'white'],
      accessory: u.accessory,
    };
    POSES.forEach((pose, i) => drawPlayer(c, i * SIZE, u.row * SIZE, pose, look));
  }
  await c.png(out('runner.png'));
  await writeFile(out('runner.json'), sheetJson('runner', POSES.length, UNIFORMS.length, TAGS));
}
