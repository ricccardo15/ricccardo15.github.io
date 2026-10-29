// Riccardo as a 48×48 pixel player, facing right, in 18 frames on one sprite sheet (864×144, 3 uniforms):
//   idle 0–3 · blink 4 · run 5–8 · swing 9–12 · high five 13 · cheer 14–15 · wave 16–17   (same order as the tags in runner.json)
// F6: a bigger head (chibi, but still readable), an asymmetric idle pose that breathes (1 px) and blinks every 8 frames,
// a 4-frame swing (load, stride, contact with a trail, follow-through) and the selective outline of canvas.outlineByRamp.
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
// look.headScale = how much bigger than the 22×16 box (F6: 1.2 for Riccardo); look.blink = eyes closed.
function drawHead(c, hx, hy, look) {
  const S = look.headScale ?? 1;
  const at = (v) => Math.round(v * S);
  const put = (x, y, color) => c.set(hx + at(x), hy + at(y), color);
  const fill = (x, y, w, h, color) => c.rect(hx + at(x), hy + at(y), Math.max(1, at(x + w) - at(x)), Math.max(1, at(y + h) - at(y)), color);
  // An ellipse in head units, painted at the scaled size; `where` still speaks head units.
  const ellipse = (cx, cy, rx, ry, paintAt, where = () => true) => {
    for (let y = Math.floor((cy - ry) * S); y <= Math.ceil((cy + ry) * S); y++) {
      for (let x = Math.floor((cx - rx) * S); x <= Math.ceil((cx + rx) * S); x++) {
        if (((x / S - cx) / rx) ** 2 + ((y / S - cy) / ry) ** 2 <= 1 && where(x / S, y / S, x, y)) paintAt(x, y);
      }
    }
  };
  const paint = (color) => (x, y) => c.set(hx + x, hy + y, color);
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
    ellipse(12.5, 9, 7, 6.5, paint(shade), (x, y, px, py) => y >= 13 && (px + py) % 2 === 0 && x > 8); // a checker of real pixels
    for (let x = 11; x <= 16; x++) put(x, 15, shade);
  }
  fill(14, 7, 6, 1, shade);
  // eyebrow, eye (closed on the blink frame), mouth
  fill(13, 8, 4, 1, hair);
  if (look.blink) {
    fill(14, 10, 2, 1, hair);
  } else {
    put(14, 9, 'white'); put(14, 10, 'white');
    put(15, 9, 'black'); put(15, 10, 'black');
  }
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
// idle (F6): weight on the back leg, front knee bent, back hand on the hip, the front hand holds the accessory.
// Frames 0–1 up, 2–3 down one pixel (the breath); frame 4 = frame 3 with the eyes closed (CSS shows it once every 8 frames).
const IDLE = { back: [[21, 35], [20, 42]], front: [[29, 35], [32, 42]], armBack: [[16, 24], [20, 28]] };
const POSES = [
  { ...IDLE, armFront: [[31, 23], [32, 27]], bob: 0 },
  { ...IDLE, armFront: [[31, 23], [32, 28]], bob: 0 },
  { ...IDLE, armFront: [[31, 24], [32, 28]], bob: 1 },
  { ...IDLE, armFront: [[31, 24], [32, 29]], bob: 1 },
  { ...IDLE, armFront: [[31, 24], [32, 29]], bob: 1, blink: true },
  // run: stride, pass, stride (other leg), pass
  { back: [[20, 35], [15, 39]], front: [[32, 35], [35, 42]], armBack: [[29, 23], [33, 20]], armFront: [[24, 23], [21, 26]], bob: 0 },
  { back: [[26, 33], [21, 38]], front: [[29, 36], [27, 42]], armBack: [[23, 24], [21, 27]], armFront: [[27, 24], [30, 26]], bob: -2 },
  { back: [[32, 35], [35, 42]], front: [[20, 35], [15, 39]], armBack: [[21, 23], [18, 26]], armFront: [[32, 23], [36, 20]], bob: 0 },
  { back: [[29, 36], [27, 42]], front: [[26, 33], [21, 38]], armBack: [[27, 24], [30, 26]], armFront: [[23, 24], [21, 27]], bob: -2 },
  // swing (F6): load (weight back, hands high, bat up behind), stride (front foot forward, the bat starts to drop),
  // contact (hips turned, arms long, a trail behind the bat), follow-through (bat round over the shoulder, back heel up)
  { back: [[19, 35], [16, 42]], front: [[30, 35], [33, 42]], armBack: [[17, 21], [19, 15]], armFront: [[23, 21], [19, 15]], bat: [[19, 15], [10, 1]], bob: 1 },
  { back: [[20, 35], [15, 42]], front: [[33, 35], [38, 42]], armBack: [[19, 22], [21, 18]], armFront: [[25, 22], [21, 18]], bat: [[21, 18], [7, 10]], bob: 1 },
  { back: [[24, 35], [19, 42]], front: [[33, 35], [37, 42]], armBack: [[27, 23], [33, 24]], armFront: [[32, 23], [34, 24]], bat: [[30, 24], [46, 22]],
    trail: [[9, 15], [11, 20], [15, 24], [20, 26], [25, 27]], bob: 0 },
  { back: [[25, 34], [22, 41]], front: [[32, 35], [36, 42]], armBack: [[27, 20], [21, 15]], armFront: [[30, 19], [21, 15]], bat: [[21, 15], [6, 22]], bob: 0 },
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
  { name: 'idle', from: 0, to: 3, duration: 250 },
  { name: 'blink', from: 4, to: 4, duration: 250 },
  { name: 'run', from: 5, to: 8, duration: 100 },
  { name: 'swing', from: 9, to: 12, duration: 110 },
  { name: 'highfive', from: 13, to: 13, duration: 400 },
  { name: 'cheer', from: 14, to: 15, duration: 200 },
  { name: 'wave', from: 16, to: 17, duration: 250 },
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
  // the bigger head (F6) sits further left, so it stays centred on the body, and lower on the shoulders (short neck)
  const big = (look.headScale ?? 1) > 1;
  drawHead(c, ox + (big ? 10 : 12), oy + 2 + b, { ...look, blink: pose.blink });
  // the trail of a fast bat, in front of the body: a pale arc that gets brighter towards the bat
  if (pose.trail) pose.trail.forEach(([x, y], i) => c.rect(ox + x, oy + y, 2, 2, i < 2 ? 'navyLight' : 'navyPale'));
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
  c.outlineByRamp({ x: ox, y: oy, w: SIZE, h: SIZE });
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
      headScale: 1.2,
    };
    POSES.forEach((pose, i) => drawPlayer(c, i * SIZE, u.row * SIZE, pose, look));
  }
  await c.png(out('runner.png'));
  await writeFile(out('runner.json'), sheetJson('runner', POSES.length, UNIFORMS.length, TAGS));
}
