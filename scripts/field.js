// Draws the B3 pixel art in code (no external assets): the 320×180 field and a 16×16 runner.
//   npm run art → public/game/field.png, public/game/runner.png
// Simple placeholder art: B4 replaces these two PNGs with the final pixel art (same size, same file names).
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { FIELD, STOPS } from '../src/field-map.js';

const out = (name) => fileURLToPath(new URL(`../public/game/${name}`, import.meta.url));

const C = {
  sky: '#8fd3ff', skyLight: '#bde8ff', cloud: '#ffffff',
  wall: '#1b2a4a', stripe: '#b3261e',
  grass: '#3f9b3a', grassDark: '#358a31',
  dirt: '#c98a4b', dirtDark: '#a86b36',
  line: '#ffffff', navy: '#1b2a4a', shade: '#0f1a30',
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function canvas(width, height) {
  const data = Buffer.alloc(width * height * 4);
  const set = (x, y, hex) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const i = (y * width + x) * 4;
    data.set([...rgb(hex), 255], i);
  };
  const rect = (x, y, w, h, hex) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, hex); };
  const png = (file) => sharp(data, { raw: { width, height, channels: 4 } }).png({ palette: true }).toFile(file);
  return { set, rect, png };
}

// Is (x, y) inside the diamond centred on (cx, cy) with half-width rx and half-height ry?
const inDiamond = (x, y, cx, cy, rx, ry) => Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1;

function line(c, x0, y0, x1, y1, hex) {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let s = 0; s <= steps; s++) c.set(Math.round(x0 + ((x1 - x0) * s) / steps), Math.round(y0 + ((y1 - y0) * s) / steps), hex);
}

async function field() {
  const { width: W, height: H } = FIELD;
  const c = canvas(W, H);
  const at = Object.fromEntries(STOPS.map((s) => [s.id, s]));
  const cx = at.levante.x, cy = at.nipotyno.y; // centre of the diamond (pitcher's mound)
  const rx = at.nipotyno.x - cx, ry = at.home.y - cy;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let color;
      if (y < 22) color = y < 10 ? C.sky : C.skyLight;
      else if (y < 30) color = y === 25 || y === 26 ? C.stripe : C.wall;
      else if (inDiamond(x, y, cx, cy, rx + 14, ry + 12) && y > 40) color = (x + y) % 7 ? C.dirt : C.dirtDark;
      else color = ((x + 2 * y) >> 4) & 1 ? C.grass : C.grassDark; // mowing stripes
      if (inDiamond(x, y, cx, cy, rx - 9, ry - 7)) color = ((x + 2 * y) >> 4) & 1 ? C.grass : C.grassDark;
      c.set(x, y, color);
    }
  }
  // Clouds
  for (const [x, y, w] of [[30, 4, 18], [36, 2, 8], [210, 6, 22], [216, 4, 10], [280, 12, 14]]) c.rect(x, y, w, 2, C.cloud);

  // Foul lines from home plate through 1st and 3rd, to the wall.
  line(c, at.home.x, at.home.y, at.home.x + 2 * (at.nipotyno.x - at.home.x) * 1.6, at.home.y + (at.nipotyno.y - at.home.y) * 2.85, C.line);
  line(c, at.home.x, at.home.y, at.home.x + 2 * (at.housing.x - at.home.x) * 1.6, at.home.y + (at.housing.y - at.home.y) * 2.85, C.line);

  // Pitcher's mound
  for (let y = -4; y <= 4; y++) for (let x = -6; x <= 6; x++) if ((x * x) / 36 + (y * y) / 16 <= 1) c.set(cx + x, cy + y, C.dirt);
  c.rect(cx - 2, cy, 5, 1, C.line);

  // Bases: white squares (home plate a little wider).
  for (const id of ['nipotyno', 'levante', 'housing']) c.rect(at[id].x - 2, at[id].y - 2, 5, 5, C.line);
  c.rect(at.home.x - 3, at.home.y - 2, 7, 3, C.line);
  c.rect(at.home.x - 2, at.home.y + 1, 5, 1, C.line);
  c.rect(at.home.x - 1, at.home.y + 2, 3, 1, C.line);

  // Dugout: navy roof, dark opening, red bench.
  const d = at.lab;
  c.rect(d.x - 26, d.y - 12, 52, 4, C.navy);
  c.rect(d.x - 24, d.y - 8, 48, 14, C.shade);
  c.rect(d.x - 22, d.y + 2, 44, 2, C.stripe);
  c.rect(d.x - 26, d.y + 6, 52, 2, C.navy);

  await c.png(out('field.png'));
}

// 16×16 runner, drawn as text: one character per pixel.
const RUNNER = `
......NNNN......
.....NNNNNN.....
....NNNNNNNNN...
.....SSSSS......
.....SKSKS......
.....SSSSS......
......SSS.......
....RRRRRRR.....
...SRRRWRRRS....
...S.RRRRR.S....
.....RRRRR......
.....NNNNN......
.....NN.NN......
.....NN.NN......
.....WW.WW......
....KKK.KKK.....`;

async function runner() {
  const colors = { N: C.navy, S: '#e0a982', K: '#1b1b1b', R: C.stripe, W: '#ffffff' };
  const rows = RUNNER.trim().split('\n');
  const data = Buffer.alloc(16 * 16 * 4);
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (colors[ch]) data.set([...rgb(colors[ch]), 255], (y * 16 + x) * 4);
  }));
  await sharp(data, { raw: { width: 16, height: 16, channels: 4 } }).png().toFile(out('runner.png'));
}

await mkdir(fileURLToPath(new URL('../public/game/', import.meta.url)), { recursive: true });
await field();
await runner();
console.log('✓ public/game/field.png, public/game/runner.png');
