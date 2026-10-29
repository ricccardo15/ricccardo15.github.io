// Placeholder cover of Sensor lab (F1): the dugout chalkboard with the name, a microcontroller board pinned to it
// and "IN PREPARATION". F7 replaces it with the real pictures of the exercises.
// 160×120 in the site palette, saved 4× with nearest neighbour as public/assets/sensor-lab/cover.webp (640×480 = 4:3, like the cards).
// All original.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { canvas, seeded } from './canvas.js';
import { GLYPHS } from './title.js';

const W = 160, H = 120;
const DIR = new URL('../../public/assets/sensor-lab/', import.meta.url);
const FILE = fileURLToPath(new URL('cover.webp', DIR));

// Chalk text with the pixel font of the title (scripts/art/title.js), `scale` screen pixels per font pixel.
function chalk(c, text, x, y, scale, color) {
  [...text].forEach((ch, n) => {
    GLYPHS[ch].split('|').forEach((row, j) => [...row].forEach((p, i) => {
      if (p === '#') c.rect(x + (n * 6 + i) * scale, y + j * scale, scale, scale, color);
    }));
  });
}
const width = (text, scale) => (text.length * 6 - 1) * scale;

// A generic microcontroller board (no brand): pin headers, a chip, a USB port, a LED, wires to a sensor.
function board(c, x, y) {
  c.rect(x + 2, y + 2, 44, 28, 'navyDark'); // shadow
  c.rect(x, y, 44, 28, 'sky');
  c.rect(x, y, 44, 1, 'skyLight');
  for (let i = 0; i < 10; i++) { c.set(x + 4 + i * 4, y + 2, 'black'); c.set(x + 4 + i * 4, y + 25, 'black'); } // pin headers
  c.rect(x + 16, y + 9, 14, 10, 'black'); // the chip
  for (let i = 0; i < 4; i++) { c.set(x + 18 + i * 3, y + 8, 'greyLight'); c.set(x + 18 + i * 3, y + 19, 'greyLight'); }
  c.rect(x - 2, y + 10, 6, 7, 'greyLight'); // USB port
  c.rect(x - 2, y + 10, 6, 1, 'white');
  c.set(x + 36, y + 8, 'red'); // LED
  c.set(x + 36, y + 7, 'redLight');
  // Wires to a small round sensor on the right.
  c.line(x + 44, y + 6, x + 56, y + 6, 'red');
  c.line(x + 44, y + 12, x + 56, y + 12, 'yellow');
  c.rect(x + 56, y + 3, 10, 12, 'navy');
  c.rect(x + 58, y + 5, 6, 8, 'white');
  c.rect(x + 60, y + 7, 2, 4, 'navyDark');
}

export async function sensorLabCover() {
  const c = canvas(W, H);
  const rand = seeded(17);

  // The dugout: back wall with planks, roof with a red edge.
  c.rect(0, 0, W, H, 'navyDark');
  for (let x = 6; x < W; x += 10) c.rect(x, 10, 1, 100, 'navy');
  c.rect(0, 0, W, 9, 'navy');
  c.rect(0, 0, W, 1, 'redLight');
  c.rect(0, 9, W, 2, 'black');

  // Chalkboard: wooden frame, green board with chalk dust, chalk tray.
  c.rect(12, 13, 136, 76, 'dirtDark');
  c.rect(12, 13, 136, 1, 'dirt');
  c.rect(15, 16, 130, 70, 'grassDark');
  for (let i = 0; i < 160; i++) c.set(16 + Math.floor(rand() * 128), 17 + Math.floor(rand() * 68), 'grass');
  c.rect(12, 89, 136, 3, 'dirt');
  c.rect(12, 92, 136, 1, 'black');
  c.rect(30, 87, 5, 2, 'white');

  // SENSOR LAB, underlined; the board; IN PREPARATION.
  chalk(c, 'SENSOR LAB', Math.round((W - width('SENSOR LAB', 2)) / 2), 20, 2, 'white');
  c.rect(30, 36, 100, 1, 'yellow');
  board(c, 44, 43);
  chalk(c, 'IN PREPARATION', Math.round((W - width('IN PREPARATION', 1)) / 2), 77, 1, 'yellow');

  // Bench, rail and floor.
  c.rect(8, 98, 144, 4, 'red');
  c.rect(8, 98, 144, 1, 'redLight');
  for (const x of [14, 72, 138]) c.rect(x, 102, 3, 6, 'dirtDark');
  c.rect(0, 108, W, 3, 'grey');
  c.rect(0, 108, W, 1, 'white');
  for (let x = 4; x < W; x += 16) c.rect(x, 111, 2, 5, 'grey');
  c.rect(0, 116, W, 4, 'dirtDark');
  for (let i = 0; i < 40; i++) c.set(Math.floor(rand() * W), 116 + Math.floor(rand() * 4), 'dirt');

  await mkdir(DIR, { recursive: true });
  await c.webp(FILE, 4);
}
