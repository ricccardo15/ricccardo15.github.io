// Riccardo as a 48×48 pixel player, facing right, in 15 frames on one sprite sheet (720×144, 3 uniforms):
//   idle 0–1 · run 2–5 · swing 6–9 · high five 10 · cheer 11–12 · wave 13–14   (same order as the tags in runner.json)
// One row per uniform (src/uniforms.js): Researcher, Designer, Maker = palette swap + accessory.
// Look taken from his reference photo (docs/reference/, private): navy helmet and jersey, dark curly hair,
// stubble, black earring, white pants and batting gloves, black wristbands. The photo itself is never used.
// The head and the torso are drawn for this size (not scaled up from the old 32 px sprite); the poses start from the
// old joint positions ×1.5 and were then touched up by eye.
// drawPlayer() is shared with scripts/art/crew.js (coaches, teammates, pitcher).
import { writeFile } from 'node:fs/promises';
import { canvas } from './canvas.js';
import { UNIFORMS } from '../../src/uniforms.js';

export const SIZE = 48;

// --- Head (22×16 box, drawn with shapes: helmet or cap, curly hair, face, stubble, earring) -------------------

function ellipse(cx, cy, rx, ry, paint, where = () => true) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && where(x, y)) paint(x, y);
    }
  }
}

// look.gear = { main, light, shade } of the helmet (with ear flap) or the cap; look.helmet = true for the helmet.
function drawHead(c, hx, hy, look) {
  const put = (x, y, color) => c.set(hx + x, hy + y, color);
  const fill = (x, y, w, h, color) => c.rect(hx + x, hy + y, w, h, color);
  const paint = (color) => (x, y) => put(x, y, color);
  const { gear } = look;
  const skin = look.skin ?? 'skin';
  const shade = look.skinShade ?? 'skinDark';
  const hair = look.hair ?? 'hair';

  // curly hair at the back and the nape, behind everything else
  ellipse(3, 8.5, 3, 3.5, paint('black'));
  ellipse(4, 12.5, 3.2, 2.5, paint('black'));
  ellipse(7, 13, 2.5, 2, paint('black'));
  for (const [x, y] of [[1, 8], [2, 11], [4, 13], [6, 14], [3, 7], [5, 12]]) put(x, y, hair); // curls catching the light

  // neck and face
  fill(9, 12, 6, 4, shade);
  ellipse(12.5, 9, 7, 6.5, paint(skin));
  fill(19, 9, 2, 3, skin); // nose
  put(20, 11, shade);
  put(20, 12, shade);
  // stubble on the jaw and the chin, a little shadow under the brim
  if (look.stubble !== false) {
    ellipse(12.5, 9, 7, 6.5, paint(shade), (x, y) => y >= 13 && (x + y) % 2 === 0 && x > 8);
    for (let x = 11; x <= 16; x++) put(x, 15, shade);
  }
  fill(14, 7, 6, 1, shade);
  // eyebrow, eye, mouth
  fill(13, 8, 4, 1, hair);
  put(14, 9, 'white'); put(14, 10, 'white');
  put(15, 9, 'black'); put(15, 10, 'black');
  fill(15, 13, 3, 1, 'redDark');
  // the ear
  ellipse(8.5, 10, 1.6, 2.2, paint(shade));

  // helmet or cap: dome, light on the top, shade at the front, brim with its shadow
  ellipse(10.5, 7, 9.5, 7.5, paint(gear.main), (x, y) => y <= 6 && y >= 0);
  ellipse(10.5, 7, 9.5, 7.5, paint(gear.light), (x, y) => y <= 3 && x >= 3 && x <= 11 && ((x - 10.5) / 9.5) ** 2 + ((y - 7) / 7.5) ** 2 > 0.55);
  ellipse(10.5, 7, 9.5, 7.5, paint(gear.shade), (x, y) => y <= 6 && y >= 3 && x >= 17);
  fill(13, 5, 9, 2, gear.main);
  fill(13, 7, 9, 1, gear.shade);
  fill(14, 5, 7, 1, gear.light);
  if (look.helmet) {
    // ear flap with a little rim, hanging over the ear
    ellipse(5.5, 9.5, 3.4, 4.3, paint(gear.shade), (x, y) => y >= 5);
    ellipse(5.5, 9.5, 3.4, 4.3, paint(gear.main), (x, y) => y >= 5 && x <= 3);
    for (const [x, y] of [[6, 8], [6, 9]]) put(x, y, gear.light);
    if (look.earring) { put(7, 14, 'black'); put(7, 15, 'black'); put(8, 14, 'black'); }
  } else if (look.earring) {
    put(8, 12, 'black'); put(8, 13, 'black');
  }
}

// --- Torso (15×12): jersey with light/shade, chest number, belt, top of the pants ----------------------------

const TORSO = `
..MMNNNNNNNNN..
.MMNNNNNNNNNND.
.MNNNNNNNNNNND.
.MNNNNNNNRRNND.
.MNNNNNNRRRRND.
.NNNNNNNNRRNND.
.NNNNNNNNNNNND.
.NNNNNNNNNNNND.
..NNNNNNNNNND..
..KKKKKKKKKKK..
..WWWWWWWWWWw..
..WWWWWWWWWWw..`;
const torsoKey = (look) => ({
  N: look.jersey.main, M: look.jersey.light, D: look.jersey.shade, R: look.number ?? look.jersey.main,
  K: 'black', W: look.pants.main, w: look.pants.shade,
});

// --- Poses: knee/ankle of each leg, elbow/hand of each arm (sprite pixels), body bob, optional bat ----------
// `prop: false` = hands busy (high five, cheer, wave): no lens or wrench in the hand.
export const legs = {
  stand: { back: [[22, 35], [22, 42]], front: [[27, 35], [27, 42]] },
  wide: { back: [[19, 35], [15, 42]], front: [[31, 35], [36, 42]] },
  jump: { back: [[21, 33], [20, 39]], front: [[30, 33], [32, 39]] },
};
const POSES = [
  // idle: standing, a small breath on the second frame
  { ...legs.stand, armBack: [[21, 23], [21, 27]], armFront: [[30, 23], [30, 27]], bob: 0 },
  { ...legs.stand, armBack: [[21, 24], [21, 29]], armFront: [[30, 24], [30, 29]], bob: 1 },
  // run: stride, pass, stride (other leg), pass
  { back: [[20, 35], [15, 39]], front: [[32, 35], [35, 42]], armBack: [[29, 23], [33, 20]], armFront: [[24, 23], [21, 26]], bob: 0 },
  { back: [[26, 33], [21, 38]], front: [[29, 36], [27, 42]], armBack: [[23, 24], [21, 27]], armFront: [[27, 24], [30, 26]], bob: -2 },
  { back: [[32, 35], [35, 42]], front: [[20, 35], [15, 39]], armBack: [[21, 23], [18, 26]], armFront: [[32, 23], [36, 20]], bob: 0 },
  { back: [[29, 36], [27, 42]], front: [[26, 33], [21, 38]], armBack: [[27, 24], [30, 26]], armFront: [[23, 24], [21, 27]], bob: -2 },
  // swing: stance, load, contact, follow-through
  { ...legs.wide, armBack: [[20, 23], [21, 18]], armFront: [[26, 23], [21, 18]], bat: [[21, 18], [14, 3]], bob: 0 },
  { ...legs.wide, armBack: [[18, 23], [18, 20]], armFront: [[24, 23], [18, 20]], bat: [[18, 20], [8, 8]], bob: 1 },
  { back: legs.wide.back, front: [[33, 35], [37, 42]], armBack: [[27, 23], [33, 24]], armFront: [[32, 23], [33, 24]], bat: [[29, 24], [45, 23]], bob: 0 },
  { ...legs.wide, armBack: [[26, 21], [20, 17]], armFront: [[29, 20], [20, 17]], bat: [[20, 17], [6, 23]], bob: 0 },
  // high five: front hand up and forward
  { ...legs.stand, armBack: [[21, 23], [21, 27]], armFront: [[35, 15], [39, 9]], bob: 0, prop: false },
  // cheer: both arms up, then a little jump
  { ...legs.stand, armBack: [[15, 15], [9, 9]], armFront: [[35, 14], [38, 8]], bob: 0, prop: false },
  { ...legs.jump, armBack: [[15, 12], [9, 5]], armFront: [[35, 11], [38, 3]], bob: -2, prop: false },
  // wave: front hand up, then out to the side
  { ...legs.stand, armBack: [[21, 23], [21, 27]], armFront: [[33, 15], [33, 9]], bob: 0, prop: false },
  { ...legs.stand, armBack: [[21, 23], [21, 27]], armFront: [[33, 15], [38, 11]], bob: 0, prop: false },
];
export const TAGS = [
  { name: 'idle', from: 0, to: 1, duration: 500 },
  { name: 'run', from: 2, to: 5, duration: 100 },
  { name: 'swing', from: 6, to: 9, duration: 110 },
  { name: 'highfive', from: 10, to: 10, duration: 400 },
  { name: 'cheer', from: 11, to: 12, duration: 200 },
  { name: 'wave', from: 13, to: 14, duration: 250 },
];

// --- Limbs ---------------------------------------------------------------------------------------------------

function leg(c, ox, oy, hip, [knee, ankle], color, shade) {
  c.line(ox + hip[0], oy + hip[1], ox + knee[0], oy + knee[1], color, 4);
  c.line(ox + knee[0], oy + knee[1], ox + ankle[0], oy + ankle[1], color, 4);
  c.line(ox + knee[0] + 1, oy + knee[1] + 1, ox + ankle[0] + 1, oy + ankle[1], shade, 1); // a seam of shade on the inside
  c.rect(ox + ankle[0] - 2, oy + ankle[1] + 2, 7, 3, 'black'); // cleat, toe to the right
  c.rect(ox + ankle[0] - 2, oy + ankle[1] + 4, 7, 1, 'greyDark'); // sole
}

function arm(c, ox, oy, shoulder, [elbow, hand], { sleeve, sleeveShade, skin, glove }) {
  c.line(ox + shoulder[0], oy + shoulder[1], ox + elbow[0], oy + elbow[1], sleeve, 3);
  c.line(ox + shoulder[0] + 1, oy + shoulder[1] + 2, ox + elbow[0] + 1, oy + elbow[1] + 1, sleeveShade, 1);
  c.line(ox + elbow[0], oy + elbow[1], ox + hand[0], oy + hand[1], skin, 3);
  if (glove) {
    c.rect(ox + hand[0] - 1, oy + hand[1] - 2, 3, 2, 'black'); // wristband
    c.rect(ox + hand[0] - 1, oy + hand[1], 4, 4, glove); // batting glove
    c.rect(ox + hand[0] + 2, oy + hand[1] + 3, 1, 1, 'greyLight');
  }
}

// Accessory of the uniform, shown when the hands are free (idle and run frames); the pencil always shows.
function accessory(c, ox, oy, b, [hx, hy], kind) {
  if (kind === 'lens') { // magnifying glass held up in the front hand
    c.line(ox + hx + 1, oy + hy, ox + hx + 5, oy + hy - 2, 'wood', 2);
    const cx = ox + hx + 9, cy = oy + hy - 4;
    ellipse(cx, cy, 5, 5, (x, y) => c.set(x, y, 'navyMid'));
    ellipse(cx, cy, 3.4, 3.4, (x, y) => c.set(x, y, 'skyLight'));
    c.set(cx - 2, cy - 2, 'white'); c.set(cx - 1, cy - 2, 'white'); c.set(cx - 2, cy - 1, 'white');
  } else if (kind === 'wrench') { // wrench in the front hand
    c.line(ox + hx + 2, oy + hy + 1, ox + hx + 8, oy + hy - 5, 'greyLight', 3);
    c.line(ox + hx + 3, oy + hy + 2, ox + hx + 9, oy + hy - 4, 'greyDark', 1);
    c.rect(ox + hx + 6, oy + hy - 12, 3, 6, 'greyLight'); // the two prongs of the open jaw…
    c.rect(ox + hx + 11, oy + hy - 12, 3, 6, 'greyLight');
    c.rect(ox + hx + 6, oy + hy - 8, 8, 2, 'greyLight'); // …and the base
    c.rect(ox + hx + 6, oy + hy - 7, 8, 1, 'greyDark');
  } else if (kind === 'pencil') { // yellow pencil behind the ear
    c.line(ox + 14, oy + b + 15, ox + 19, oy + b + 9, 'yellow', 2);
    c.line(ox + 15, oy + b + 16, ox + 20, oy + b + 10, 'dirtDark', 1);
    c.set(ox + 13, oy + b + 17, 'black'); c.set(ox + 14, oy + b + 17, 'black'); // tip
    c.rect(ox + 19, oy + b + 7, 3, 3, 'redLight'); // eraser
  }
}

// One player in one 48×48 cell. `look`: gear (helmet/cap colours), jersey {main, light, shade}, number, pants {far, main, shade},
// sleeve colours, skin, glove, accessory, earring; `stubble: false` = clean-shaven (the crew).
export function drawPlayer(c, ox, oy, pose, look) {
  const b = pose.bob;
  const arms = { sleeve: look.jersey.main, sleeveShade: look.jersey.shade, skin: look.skin ?? 'skin', glove: look.glove };
  arm(c, ox, oy, [19, 19 + b], pose.armBack, arms);
  leg(c, ox, oy, [21, 28 + b], pose.back, look.pants.far, look.pants.shade);
  c.map(ox + 16, oy + 16 + b, TORSO, torsoKey(look));
  leg(c, ox, oy, [26, 28 + b], pose.front, look.pants.main, look.pants.shade);
  drawHead(c, ox + 12, oy + 2 + b, look);
  if (pose.bat) {
    const [[x0, y0], [x1, y1]] = pose.bat;
    c.line(ox + x0, oy + y0, ox + x1, oy + y1, 'wood', 3);
    c.line(ox + x0, oy + y0 - 1, ox + x1, oy + y1 - 1, 'dirtLight', 1); // a light edge on top
    c.rect(ox + x1 - 1, oy + y1 - 1, 3, 3, 'black'); // end cap
  }
  arm(c, ox, oy, [28, 19 + b], pose.armFront, arms);
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
      helmet: true,
      earring: true,
      gear: { main: u.colors.helmet, light: u.colors.helmetLight, shade: u.colors.helmetShade },
      jersey: { main: u.colors.jersey, light: u.colors.jerseyLight, shade: u.colors.jerseyShade },
      number: u.colors.number,
      pants: { main: 'white', shade: 'greyLight', far: 'skyLight' },
      glove: 'white',
      accessory: u.accessory,
    };
    POSES.forEach((pose, i) => drawPlayer(c, i * SIZE, u.row * SIZE, pose, look));
  }
  await c.png(out('runner.png'));
  await writeFile(out('runner.json'), sheetJson('runner', POSES.length, UNIFORMS.length, TAGS));
}
