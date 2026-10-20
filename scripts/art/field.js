// The 320×180 ballpark: sky, crowd, outfield wall, mowed grass, infield, dugout.
// Base positions come from src/field-map.js, so the art always matches the base links.
import { canvas, seeded } from './canvas.js';
import { FIELD, STOPS } from '../../src/field-map.js';

const inDiamond = (x, y, cx, cy, rx, ry) => Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1;
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

export async function field(out) {
  const { width: W, height: H } = FIELD;
  const c = canvas(W, H);
  const rand = seeded(7);
  const at = Object.fromEntries(STOPS.map((s) => [s.id, s]));
  const cx = at.levante.x, cy = at.nipotyno.y; // pitcher's mound = centre of the diamond
  const rx = at.nipotyno.x - cx, ry = at.home.y - cy;

  // Sky + clouds
  c.rect(0, 0, W, 14, 'sky');
  c.rect(0, 9, W, 5, 'skyLight');
  for (const [x, y, w] of [[18, 3, 16], [24, 1, 7], [118, 5, 12], [232, 2, 20], [238, 0, 9], [292, 6, 14]]) {
    c.rect(x, y, w, 2, 'white');
    c.rect(x + 2, y + 2, w - 4, 1, 'skyLight');
  }

  // Stands: grey steps with a crowd of 2×2 heads and shirts in the palette colours.
  c.rect(0, 12, W, 16, 'grey');
  for (let y = 13; y < 27; y += 4) c.rect(0, y + 3, W, 1, 'navyDark');
  const shirts = ['red', 'navy', 'white', 'yellow', 'sky', 'redLight'];
  for (let y = 13; y < 27; y += 4) {
    for (let x = (y % 8) ? 1 : 3; x < W - 1; x += 4) {
      if (rand() < 0.18) continue; // empty seat
      c.rect(x, y, 2, 1, rand() < 0.15 ? 'black' : 'skin');
      c.rect(x, y + 1, 2, 2, shirts[Math.floor(rand() * shirts.length)]);
    }
  }
  // Scoreboard in the middle of the stands
  c.rect(136, 3, 48, 22, 'navy');
  c.rect(138, 5, 44, 18, 'navyDark');
  for (let i = 0; i < 9; i++) c.rect(141 + i * 4, 8, 2, 2, i < 4 ? 'yellow' : 'grey');
  for (let i = 0; i < 9; i++) c.rect(141 + i * 4, 13, 2, 2, i < 2 ? 'yellow' : 'grey');
  c.rect(141, 18, 38, 2, 'red');
  c.rect(158, 25, 4, 3, 'navy');

  // Outfield wall with blank advertising boards (no real brands), foul poles at the corners.
  c.rect(0, 28, W, 8, 'navy');
  c.rect(0, 28, W, 1, 'navyDark');
  for (let x = 6; x < W - 20; x += 44) {
    c.rect(x, 30, 32, 4, 'white');
    c.rect(x + 2, 31, 12, 2, x % 88 === 6 ? 'red' : 'navy');
    c.rect(x + 16, 31, 14, 1, 'grey');
  }
  c.rect(2, 14, 2, 22, 'yellow');
  c.rect(W - 4, 14, 2, 22, 'yellow');

  // Grass with mowing stripes, warning track along the wall.
  for (let y = 36; y < H; y++) {
    for (let x = 0; x < W; x++) c.set(x, y, ((x + 2 * y) >> 4) & 1 ? 'grass' : 'grassDark');
  }
  c.rect(0, 36, W, 4, 'dirt');
  c.rect(0, 39, W, 1, 'dirtDark');

  // Infield dirt, infield grass, home plate circle.
  for (let y = 40; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dirt = inDiamond(x, y, cx, cy, rx + 14, ry + 12) || inEllipse(x, y, at.home.x, at.home.y, 16, 10);
      const grass = inDiamond(x, y, cx, cy, rx - 9, ry - 7) && !inEllipse(x, y, at.home.x, at.home.y, 16, 10);
      if (grass) c.set(x, y, ((x + 2 * y) >> 4) & 1 ? 'grass' : 'grassDark');
      else if (dirt) c.set(x, y, rand() < 0.12 ? 'dirtDark' : 'dirt');
    }
  }

  // Foul lines: from home through 1st and 3rd base to the warning track.
  for (const base of [at.nipotyno, at.housing]) {
    const dx = base.x - at.home.x, dy = base.y - at.home.y;
    const t = (40 - at.home.y) / dy;
    c.line(at.home.x, at.home.y, at.home.x + dx * t, 40, 'white');
  }

  // Batter's boxes either side of home plate
  for (const side of [-1, 1]) {
    const x = at.home.x + side * 7 - (side < 0 ? 5 : 0);
    c.line(x, at.home.y - 5, x + 5, at.home.y - 5, 'white');
    c.line(x, at.home.y + 4, x + 5, at.home.y + 4, 'white');
    c.line(x, at.home.y - 5, x, at.home.y + 4, 'white');
    c.line(x + 5, at.home.y - 5, x + 5, at.home.y + 4, 'white');
  }

  // Pitcher's mound with the rubber
  for (let y = -5; y <= 5; y++) for (let x = -8; x <= 8; x++) if (inEllipse(x, y, 0, 0, 8, 5)) c.set(cx + x, cy + y, y < -2 ? 'dirt' : (y > 2 ? 'dirtDark' : 'dirt'));
  c.rect(cx - 2, cy - 1, 5, 1, 'white');

  // Bases: white bags with a shadow; home plate is a small pentagon.
  for (const id of ['nipotyno', 'levante', 'housing']) {
    c.rect(at[id].x - 2, at[id].y - 2, 5, 5, 'white');
    c.rect(at[id].x - 2, at[id].y + 3, 5, 1, 'dirtDark');
  }
  c.rect(at.home.x - 3, at.home.y - 2, 7, 3, 'white');
  c.rect(at.home.x - 2, at.home.y + 1, 5, 1, 'white');
  c.rect(at.home.x - 1, at.home.y + 2, 3, 1, 'white');

  // On-deck circle near the dugout
  for (let a = 0; a < 24; a++) c.set(at.home.x - 44 + Math.round(5 * Math.cos(a / 3.82)), at.home.y + 4 + Math.round(3 * Math.sin(a / 3.82)), 'dirtDark');

  // Dugout: roof, dark inside with a red bench, a rail in front, a bat rack.
  const d = at.lab;
  c.rect(d.x - 28, d.y - 14, 56, 4, 'navy');
  c.rect(d.x - 28, d.y - 14, 56, 1, 'redLight');
  c.rect(d.x - 26, d.y - 10, 52, 16, 'navyDark');
  c.rect(d.x - 24, d.y - 1, 48, 2, 'red');
  c.rect(d.x - 24, d.y + 1, 2, 3, 'red');
  c.rect(d.x + 22, d.y + 1, 2, 3, 'red');
  for (let i = 0; i < 4; i++) c.line(d.x - 20 + i * 3, d.y - 8, d.x - 21 + i * 3, d.y - 3, 'dirt');
  c.rect(d.x - 28, d.y + 6, 56, 2, 'grey');
  for (let x = d.x - 28; x < d.x + 28; x += 6) c.rect(x, d.y + 4, 1, 2, 'grey');

  await c.png(out('field.png'));
}
