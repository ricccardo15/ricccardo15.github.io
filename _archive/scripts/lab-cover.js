// Cover of the Lab: the dugout chalkboard with one little picture per piece of work in content/lab.md.
//   a magnifying glass on a page (heuristic evaluation) · a phone with a tab bar (Discord vs iOS) · a grid of six panels (storyboard)
// 160×120 in the site palette, saved 4× with nearest neighbour as public/assets/lab/cover.webp (640×480 = 4:3, like the cards).
// All original. Change the list of works in content/lab.md → change the tiles here.
import { fileURLToPath } from 'node:url';
import { canvas, seeded } from './canvas.js';
import { GLYPHS } from './title.js';

const W = 160, H = 120;
const FILE = fileURLToPath(new URL('../../public/assets/lab/cover.webp', import.meta.url));

// Chalk text with the pixel font of the title (scripts/art/title.js), `scale` screen pixels per font pixel.
function chalk(c, text, x, y, scale, color) {
  [...text].forEach((ch, n) => {
    GLYPHS[ch].split('|').forEach((row, j) => [...row].forEach((p, i) => {
      if (p === '#') c.rect(x + (n * 6 + i) * scale, y + j * scale, scale, scale, color);
    }));
  });
}

// A paper pinned to the board: shadow, white sheet, red pin. `draw(c, x, y)` paints inside it (36×36).
function paper(c, x, y, draw) {
  c.rect(x + 2, y + 2, 36, 36, 'navyDark');
  c.rect(x, y, 36, 36, 'white');
  c.rect(x, y, 36, 1, 'skyLight');
  draw(c, x, y);
  c.rect(x + 17, y - 1, 3, 3, 'red');
  c.set(x + 17, y - 1, 'redLight');
}

// Heuristic evaluation: lines of text, one marked in red, and a magnifying glass over it.
function heuristic(c, x, y) {
  [[6, 20], [10, 16], [14, 22], [18, 12], [22, 18], [26, 14]].forEach(([dy, w], i) => c.rect(x + 4, y + dy, w, 1, i === 1 ? 'red' : 'grey'));
  const cx = x + 23, cy = y + 21;
  for (let dy = -8; dy <= 8; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      const d = dx * dx + dy * dy;
      if (d <= 36) c.set(cx + dx, cy + dy, 'skyLight');
      else if (d <= 60) c.set(cx + dx, cy + dy, 'navy');
    }
  }
  c.rect(cx - 5, cy - 1, 9, 2, 'red'); // the marked line, magnified
  c.rect(cx - 5, cy + 3, 6, 1, 'grey');
  c.set(cx - 4, cy - 5, 'white');
  c.set(cx - 3, cy - 5, 'white');
  c.line(cx + 6, cy + 6, cx + 11, cy + 11, 'dirtDark', 2);
}

// Discord vs iOS: a phone with a tab bar (what the guidelines expect).
function phone(c, x, y) {
  c.rect(x + 10, y + 3, 16, 31, 'navy');
  c.rect(x + 11, y + 5, 14, 26, 'skyLight');
  c.rect(x + 11, y + 5, 14, 4, 'sky');
  c.rect(x + 16, y + 3, 4, 1, 'black');
  [[11, 9], [15, 8], [19, 10]].forEach(([dy, w], i) => c.rect(x + 13 + (i % 2) * 2, y + dy, w, 2, 'grey'));
  c.rect(x + 11, y + 26, 14, 5, 'white'); // the tab bar
  [13, 16, 19, 22].forEach((dx, i) => c.rect(x + dx, y + 27, 2, 2, i === 1 ? 'red' : 'grey'));
  c.rect(x + 14, y + 30, 8, 1, 'grey');
}

// Storyboard: six panels in two rows, each with a tiny scene (suitcase, packing, stress, airport, reminder, relief).
function storyboard(c, x, y) {
  const scenes = [
    (px, py) => { c.rect(px + 2, py + 6, 6, 5, 'dirt'); c.rect(px + 4, py + 4, 2, 2, 'dirtDark'); c.rect(px + 2, py + 8, 6, 1, 'dirtDark'); },
    (px, py) => { c.rect(px + 3, py + 3, 3, 3, 'skin'); c.rect(px + 2, py + 6, 5, 5, 'navy'); c.rect(px + 7, py + 8, 2, 3, 'dirt'); },
    (px, py) => { c.rect(px + 3, py + 4, 3, 3, 'skin'); c.rect(px + 2, py + 7, 5, 5, 'navy'); c.rect(px + 8, py + 2, 1, 4, 'red'); c.set(px + 8, py + 7, 'red'); },
    (px, py) => { c.rect(px, py, 10, 15, 'sky'); c.rect(px + 1, py + 7, 8, 2, 'white'); c.rect(px + 4, py + 4, 2, 7, 'white'); c.rect(px + 1, py + 12, 8, 3, 'grass'); },
    (px, py) => { c.rect(px + 2, py + 3, 6, 6, 'yellow'); c.rect(px + 3, py + 9, 4, 1, 'yellow'); c.rect(px + 4, py + 10, 2, 2, 'dirtDark'); },
    (px, py) => { c.rect(px + 3, py + 5, 3, 3, 'skin'); c.rect(px + 2, py + 8, 5, 5, 'navy'); c.rect(px + 7, py + 1, 2, 2, 'yellow'); c.set(px + 4, py + 7, 'black'); },
  ];
  scenes.forEach((scene, n) => {
    const px = x + 2 + (n % 3) * 11, py = y + 3 + Math.floor(n / 3) * 16;
    c.rect(px - 1, py - 1, 12, 17, 'navyDark');
    c.rect(px, py, 10, 15, 'white');
    scene(px, py);
  });
}

export async function labCover() {
  const c = canvas(W, H);
  const rand = seeded(11);

  // The dugout: back wall with planks, roof with a red edge.
  c.rect(0, 0, W, H, 'navyDark');
  for (let x = 6; x < W; x += 10) c.rect(x, 10, 1, 100, 'navy');
  c.rect(0, 0, W, 9, 'navy');
  c.rect(0, 0, W, 1, 'redLight');
  c.rect(0, 9, W, 2, 'black');

  // Chalkboard: wooden frame, green board with chalk dust, chalk tray with two pieces of chalk.
  c.rect(12, 13, 136, 76, 'dirtDark');
  c.rect(12, 13, 136, 1, 'dirt');
  c.rect(15, 16, 130, 70, 'grassDark');
  for (let i = 0; i < 160; i++) c.set(16 + Math.floor(rand() * 128), 17 + Math.floor(rand() * 68), 'grass');
  c.rect(12, 89, 136, 3, 'dirt');
  c.rect(12, 92, 136, 1, 'black');
  c.rect(30, 87, 5, 2, 'white');
  c.rect(38, 88, 4, 1, 'yellow');

  // Title in chalk: LAB, underlined.
  chalk(c, 'LAB', 63, 20, 2, 'white');
  c.rect(50, 36, 60, 1, 'yellow');

  // The three works, pinned side by side.
  paper(c, 18, 44, heuristic);
  paper(c, 62, 44, phone);
  paper(c, 106, 44, storyboard);

  // Dugout props: two bats leaning on the wall, a helmet on the bench, a water cooler.
  c.line(5, 94, 8, 56, 'dirt', 2);
  c.rect(7, 54, 3, 4, 'dirtDark');
  c.line(9, 94, 11, 66, 'dirt', 2);
  c.rect(10, 64, 3, 3, 'dirtDark');
  c.rect(121, 90, 11, 8, 'navy');
  c.rect(122, 91, 4, 2, 'skyLight');
  c.rect(130, 94, 5, 4, 'navyDark');
  c.rect(150, 76, 8, 22, 'sky');
  c.rect(150, 76, 8, 3, 'white');
  c.rect(151, 84, 6, 3, 'skyLight');
  c.set(157, 90, 'red');

  // Bench, rail and floor.
  c.rect(8, 98, 144, 4, 'red');
  c.rect(8, 98, 144, 1, 'redLight');
  for (const x of [14, 72, 138]) c.rect(x, 102, 3, 6, 'dirtDark');
  c.rect(0, 108, W, 3, 'grey');
  c.rect(0, 108, W, 1, 'white');
  for (let x = 4; x < W; x += 16) c.rect(x, 111, 2, 5, 'grey');
  c.rect(0, 116, W, 4, 'dirtDark');
  for (let i = 0; i < 40; i++) c.set(Math.floor(rand() * W), 116 + Math.floor(rand() * 4), 'dirt');

  await c.webp(FILE, 4);
}
