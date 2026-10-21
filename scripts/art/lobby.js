// The lobby (first screen): the tunnel / clubhouse behind "Select your player".
// 200×150, shown at 2× on desktop and 1× on phones. Lockers with jerseys and helmets, a "CLUBHOUSE" sign, ceiling lights,
// a bench, a tiled floor and a home plate in the middle where the big batter stands (feet at x 100, y 140).
// All original, palette only.
import { canvas, seeded } from './canvas.js';

export const LOBBY = { width: 200, height: 150, plate: { x: 100, y: 140 } };

export async function lobby(out) {
  const { width: W, height: H, plate } = LOBBY;
  const c = canvas(W, H);
  const rand = seeded(5);

  // Ceiling with three lamps and their light on the wall
  c.rect(0, 0, W, 14, 'black');
  for (const x of [28, 96, 164]) {
    c.rect(x, 9, 10, 3, 'yellow');
    c.rect(x + 2, 12, 6, 1, 'white');
  }
  // Back wall
  c.rect(0, 14, W, 104, 'navy');
  c.rect(0, 14, W, 2, 'navyDark');
  for (const x of [33, 101, 169]) c.rect(x - 14, 16, 28, 1, 'navyMid'); // the lamps' light

  // The sign over the lockers
  c.rect(66, 18, 68, 13, 'red');
  c.rect(66, 18, 68, 1, 'redLight');
  c.rect(66, 30, 68, 1, 'redDark');
  c.text('CLUBHOUSE', 73, 21, 'yellow');

  // A bank of steel lockers: some closed, some open with a jersey or a helmet
  const lockers = 8;
  const lw = 22;
  const x0 = Math.round((W - lockers * lw) / 2);
  const shirts = ['red', 'white', 'navyMid', 'red', 'white'];
  for (let i = 0; i < lockers; i++) {
    const x = x0 + i * lw;
    c.rect(x, 36, lw, 66, 'navyDark');
    c.rect(x + 1, 37, lw - 2, 64, 'greyDark'); // steel lockers: the navy uniform stands out on them
    c.rect(x + 1, 37, 1, 64, 'grey');
    const open = [1, 3, 6].includes(i);
    if (open) {
      c.rect(x + 2, 38, lw - 4, 62, 'black'); // inside
      c.rect(x + 2, 52, lw - 4, 1, 'greyDark'); // shelf
      if (i === 3) { // a helmet on the shelf
        c.rect(x + 6, 46, 10, 6, 'navy');
        c.rect(x + 7, 46, 6, 1, 'navyMid');
        c.rect(x + 15, 50, 3, 2, 'navy');
      } else {
        c.rect(x + 9, 40, 4, 1, 'grey'); // hanger
      }
      const shirt = shirts[i % shirts.length];
      c.rect(x + 5, 56, 12, 16, shirt); // jersey on its hanger
      c.rect(x + 3, 56, 3, 6, shirt);
      c.rect(x + 16, 56, 3, 6, shirt);
      c.rect(x + 9, 58, 4, 4, shirt === 'red' ? 'white' : 'red'); // the number
      c.rect(x + 2, 86, lw - 4, 12, 'greyDark'); // shoes / bag at the bottom
      c.rect(x + 4, 92, 6, 4, 'black');
      c.rect(x + 12, 92, 6, 4, 'black');
    } else {
      for (let v = 0; v < 3; v++) c.rect(x + 5, 40 + v * 3, lw - 10, 1, 'navyDark'); // vents
      c.rect(x + lw - 5, 64, 2, 8, 'greyLight'); // handle
      c.rect(x + 6, 80, lw - 12, 3, 'white'); // name plate
      c.rect(x + 7, 81, rand() < 0.5 ? 6 : 8, 1, 'greyDark');
    }
  }
  // A bat leaning on the lockers
  c.line(x0 - 4, 101, x0 + 2, 70, 'wood', 2);
  c.rect(x0 + 1, 68, 3, 3, 'black');

  // Bench
  c.rect(6, 104, W - 12, 4, 'wood');
  c.rect(6, 104, W - 12, 1, 'dirtLight');
  c.rect(6, 108, W - 12, 1, 'dirtDark');
  for (const x of [12, 70, 128, 186]) c.rect(x, 109, 3, 9, 'dirtDark');

  // Floor: tiles in perspective, a dirt patch and the home plate
  c.rect(0, 118, W, H - 118, 'greyDark');
  for (let y = 118; y < H; y += 6) c.rect(0, y, W, 1, 'grey');
  for (let i = -10; i <= 10; i++) c.line(plate.x + i * 9, 118, plate.x + i * 18, H, 'grey');
  for (let y = 0; y < 14; y++) {
    const half = Math.round(30 * Math.sqrt(1 - ((y - 7) / 7.5) ** 2));
    c.rect(plate.x - half, plate.y - 7 + y, half * 2, 1, y < 4 ? 'dirtLight' : (y > 10 ? 'dirtDark' : 'dirt'));
  }
  for (let i = 0; i < 24; i++) c.set(plate.x - 24 + Math.floor(rand() * 48), plate.y - 5 + Math.floor(rand() * 10), 'dirtDark');
  c.rect(plate.x - 9, plate.y - 4, 18, 4, 'white');
  c.rect(plate.x - 8, plate.y, 16, 2, 'white');
  c.rect(plate.x - 5, plate.y + 2, 10, 1, 'white');
  c.rect(plate.x - 9, plate.y - 1, 18, 1, 'greyLight');

  await c.png(out('lobby.png'));
}
