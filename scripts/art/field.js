// The 480×270 ballpark: sky, stands with three tiers of fans, scoreboard, ticket booth, outfield wall, softly mowed grass,
// infield, a big pitcher's mound, the dugout (roof in perspective) and a bullpen for later.
// Base positions come from src/field-map.js, so the art always matches the base links.
// Things a visitor will be able to click in Fase 2 are drawn here and kept inside the phone crop (x 64–416):
//   the scoreboard (About), the ticket booth (Contact & CV), the pitcher's mound (How I design), the dugout (Lab).
import { canvas, seeded } from './canvas.js';
import { FIELD, STOPS } from '../../src/field-map.js';

const inDiamond = (x, y, cx, cy, rx, ry) => Math.abs(x - cx) / rx + Math.abs(y - cy) / ry <= 1;
const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

// Rows of the picture, top to bottom.
const STANDS = { top: 16, bottom: 48 }; // 4 rows of 8 px
const WALL = { top: 48, bottom: 58 };
const TRACK_BOTTOM = 64; // the grass starts here

export async function field(out) {
  const { width: W, height: H } = FIELD;
  const c = canvas(W, H);
  const rand = seeded(7);
  const at = Object.fromEntries(STOPS.map((s) => [s.id, s]));
  const cx = at.levante.x, cy = at.nipotyno.y; // pitcher's mound = centre of the diamond
  const rx = at.nipotyno.x - cx, ry = at.home.y - cy;
  const ellipse = (ecx, ecy, erx, ery, color, where = () => true) => {
    for (let y = Math.floor(ecy - ery); y <= Math.ceil(ecy + ery); y++) {
      for (let x = Math.floor(ecx - erx); x <= Math.ceil(ecx + erx); x++) if (inEllipse(x, y, ecx, ecy, erx, ery) && where(x, y)) c.set(x, y, color);
    }
  };

  // --- Sky and clouds ------------------------------------------------------------------------------------
  c.rect(0, 0, W, STANDS.top, 'sky');
  c.rect(0, 9, W, 7, 'skyLight');
  for (const [x, y, w] of [[27, 4, 24], [36, 1, 11], [177, 7, 18], [348, 3, 30], [357, 0, 14], [438, 9, 21], [96, 10, 14]]) {
    c.rect(x, y, w, 3, 'white');
    c.rect(x + 3, y + 3, w - 6, 2, 'skyLight');
    c.rect(x + 2, y - 1, Math.floor(w / 2), 1, 'white');
  }

  // --- Stands: three tiers of seats with shadows and a crowd of 3×4 fans in the palette colours ---------------
  c.rect(0, STANDS.top, W, STANDS.bottom - STANDS.top, 'greyDark');
  c.rect(0, STANDS.top, W, 2, 'navyDark'); // the roof's shadow
  const shirts = ['red', 'navy', 'white', 'yellow', 'sky', 'redLight', 'grassLight', 'navyMid'];
  for (let row = 0; row < 4; row++) {
    const y0 = STANDS.top + 2 + row * 8;
    c.rect(0, y0 + 5, W, 1, row === 0 ? 'grey' : 'greyLight'); // the step each row sits on
    c.rect(0, y0 + 6, W, 2, 'navyDark'); // shadow under the step
    for (let x = row % 2 ? 2 : 4; x < W - 3; x += 5) {
      if (rand() < 0.14) continue; // empty seat
      const dark = row === 0; // the top tier is further away: darker
      c.rect(x, y0, 2, 2, rand() < 0.2 ? 'hair' : (rand() < 0.5 ? 'skin' : 'skinDark'));
      if (rand() < 0.2) c.rect(x - 1, y0 - 1, 4, 1, shirts[Math.floor(rand() * shirts.length)]); // a cap
      c.rect(x - 1, y0 + 2, 4, 3, dark ? 'navyMid' : shirts[Math.floor(rand() * shirts.length)]);
      c.set(x - 1, y0 + 4, 'navyDark');
    }
  }
  for (const ax of [88, 392]) { // aisles with steps
    c.rect(ax, STANDS.top + 2, 8, STANDS.bottom - STANDS.top - 2, 'greyDark');
    for (let y = STANDS.top + 4; y < STANDS.bottom; y += 4) c.rect(ax, y, 8, 1, 'greyLight');
    c.rect(ax, STANDS.top + 2, 1, STANDS.bottom - STANDS.top - 2, 'navyDark');
  }

  // --- Scoreboard (will be "About"): frame, lights, and a dark strip kept free for pixel text ------------------
  c.rect(190, 3, 100, 38, 'navy');
  c.rect(190, 3, 100, 1, 'navyMid');
  c.rect(193, 6, 94, 32, 'navyDark');
  for (let i = 0; i < 9; i++) {
    c.rect(198 + i * 10, 9, 6, 4, i < 5 ? 'yellow' : 'greyDark');
    c.rect(198 + i * 10, 9, 6, 1, i < 5 ? 'white' : 'grey');
  }
  c.rect(200, 17, 80, 11, 'black'); // free for the text (Fase 2)
  c.rect(200, 17, 80, 1, 'greyDark');
  c.rect(200, 28, 80, 1, 'greyDark');
  c.rect(196, 31, 88, 3, 'red');
  c.rect(196, 31, 88, 1, 'redLight');
  c.rect(238, 41, 4, 7, 'navy'); // the post it stands on
  c.rect(238, 41, 1, 7, 'navyMid');

  // --- Ticket booth (will be "Contact & CV"): roof, sign, window with counter, door ---------------------------
  c.rect(334, 18, 70, 5, 'red');
  c.rect(334, 18, 70, 1, 'redLight');
  c.rect(334, 22, 70, 1, 'redDark');
  c.rect(340, 23, 58, 12, 'navy');
  c.rect(340, 23, 58, 1, 'navyMid');
  c.text('TICKETS', 349, 26, 'white');
  c.rect(338, 35, 62, 13, 'dirtLight');
  c.rect(338, 35, 62, 1, 'dirt');
  c.rect(338, 47, 62, 1, 'dirtDark');
  c.rect(345, 37, 26, 9, 'navyDark'); // the window
  c.rect(347, 39, 8, 3, 'skyLight');
  c.rect(343, 45, 30, 2, 'wood'); // the counter
  c.rect(378, 37, 11, 11, 'wood');
  c.rect(378, 37, 11, 1, 'dirtDark');
  c.set(387, 43, 'yellow');
  c.rect(392, 38, 5, 6, 'white'); // a poster
  c.rect(393, 39, 3, 1, 'red');

  // --- Outfield wall with blank advertising boards (no real brands), foul poles --------------------------------
  c.rect(0, WALL.top, W, WALL.bottom - WALL.top, 'navy');
  c.rect(0, WALL.top, W, 2, 'navyMid');
  c.rect(0, WALL.bottom - 1, W, 1, 'navyDark');
  for (let x = 9; x < W - 30; x += 66) {
    c.rect(x, WALL.top + 3, 48, 6, 'white');
    c.rect(x + 3, WALL.top + 4, 18, 3, x % 132 === 9 ? 'red' : 'navyMid');
    c.rect(x + 24, WALL.top + 5, 21, 1, 'grey');
  }
  c.rect(3, 21, 3, 35, 'yellow');
  c.rect(W - 6, 21, 3, 35, 'yellow');
  c.rect(3, 21, 1, 35, 'white');
  c.rect(W - 6, 21, 1, 35, 'white');

  // --- Warning track and the grass, mowed in diagonal stripes with soft edges ---------------------------------
  c.rect(0, WALL.bottom, W, TRACK_BOTTOM - WALL.bottom, 'dirt');
  c.rect(0, WALL.bottom, W, 2, 'dirtLight');
  c.rect(0, TRACK_BOTTOM - 2, W, 2, 'dirtDark');
  const mow = (x, y) => {
    const v = (x + 2 * y) % 48;
    if (v < 21) return rand() < 0.04 ? 'grassLight' : 'grass';
    if (v < 23) return (x + y) % 2 ? 'grassLight' : 'grass'; // soft edge
    if (v < 45) return rand() < 0.04 ? 'grass' : 'grassDark';
    return (x + y) % 2 ? 'grass' : 'grassDark';
  };
  for (let y = TRACK_BOTTOM; y < H; y++) for (let x = 0; x < W; x++) c.set(x, y, mow(x, y));

  // --- Infield: dirt path, infield grass, home plate circle ---------------------------------------------------
  const homeCircle = (x, y) => inEllipse(x, y, at.home.x, at.home.y, 24, 15);
  for (let y = TRACK_BOTTOM; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dirt = inDiamond(x, y, cx, cy, rx + 21, ry + 18) || homeCircle(x, y);
      const grass = inDiamond(x, y, cx, cy, rx - 14, ry - 11) && !homeCircle(x, y);
      if (grass) c.set(x, y, mow(x, y));
      else if (dirt) {
        const r = rand();
        c.set(x, y, r < 0.1 ? 'dirtDark' : (r < 0.2 ? 'dirtLight' : 'dirt'));
      }
    }
  }
  // a soft edge of darker grass where the dirt meets the grass
  for (let y = TRACK_BOTTOM; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const inner = inDiamond(x, y, cx, cy, rx - 14, ry - 11);
      const outer = inDiamond(x, y, cx, cy, rx + 21, ry + 18);
      if (!inner && !outer && inDiamond(x, y, cx, cy, rx + 25, ry + 21) && (x + y) % 2 === 0) c.set(x, y, 'grassDark');
    }
  }

  // Foul lines: from home through 1st and 3rd base to the warning track.
  for (const base of [at.nipotyno, at.housing]) {
    const dx = base.x - at.home.x, dy = base.y - at.home.y;
    const t = (TRACK_BOTTOM - at.home.y) / dy;
    c.line(at.home.x, at.home.y, at.home.x + dx * t, TRACK_BOTTOM, 'white');
  }

  // Batter's boxes either side of home plate
  for (const side of [-1, 1]) {
    const x = at.home.x + side * 11 - (side < 0 ? 8 : 0);
    c.line(x, at.home.y - 8, x + 8, at.home.y - 8, 'white');
    c.line(x, at.home.y + 6, x + 8, at.home.y + 6, 'white');
    c.line(x, at.home.y - 8, x, at.home.y + 6, 'white');
    c.line(x + 8, at.home.y - 8, x + 8, at.home.y + 6, 'white');
  }

  // --- Pitcher's mound (will be "How I design"): a clear raised mound with shadow, light side and the rubber ---
  ellipse(cx, cy + 10, 26, 8, 'grassDark'); // its shadow on the grass
  ellipse(cx, cy, 23, 13, 'dirtDark');
  ellipse(cx, cy - 1, 22, 12, 'dirt');
  ellipse(cx - 2, cy - 4, 15, 7, 'dirtLight');
  ellipse(cx + 9, cy + 4, 11, 5, 'dirtDark', (x, y) => y > cy + 2);
  for (let i = 0; i < 40; i++) c.set(cx - 17 + Math.floor(rand() * 34), cy - 9 + Math.floor(rand() * 17), rand() < 0.5 ? 'dirtLight' : 'dirtDark');
  c.rect(cx - 5, cy - 2, 10, 2, 'white'); // the rubber
  c.rect(cx - 5, cy, 10, 1, 'greyLight');
  ellipse(cx - 17, cy + 5, 2.5, 1.5, 'white'); // the rosin bag

  // --- Bases: white bags with a shadow; home plate is a pentagon -----------------------------------------------
  for (const id of ['nipotyno', 'levante', 'housing']) {
    c.rect(at[id].x - 4, at[id].y - 4, 8, 8, 'white');
    c.rect(at[id].x - 4, at[id].y + 2, 8, 2, 'greyLight');
    c.rect(at[id].x - 4, at[id].y + 4, 8, 2, 'dirtDark');
  }
  const hp = at.home;
  c.rect(hp.x - 5, hp.y - 3, 11, 5, 'white');
  c.rect(hp.x - 4, hp.y + 2, 9, 2, 'white');
  c.rect(hp.x - 3, hp.y + 4, 7, 1, 'white');
  c.rect(hp.x - 1, hp.y + 5, 3, 1, 'white');
  c.rect(hp.x - 5, hp.y + 1, 11, 1, 'greyLight');

  // On-deck circle near the dugout
  for (let a = 0; a < 40; a++) c.set(hp.x - 66 + Math.round(8 * Math.cos(a / 6.37)), hp.y + 6 + Math.round(5 * Math.sin(a / 6.37)), 'dirtDark');

  // --- Dugout (will be "Lab"): roof in perspective, red fascia, dark inside with a bench, bats, helmets, a cooler ---
  const d = at.lab;
  const left = d.x - 42, right = d.x + 42;
  ellipse(d.x, d.y + 14, 48, 7, 'dirtDark'); // the dug-out ground in front
  for (let y = d.y - 22; y <= d.y - 13; y++) { // the roof: narrower at the back, wider at the front
    const t = (y - (d.y - 22)) / 9;
    const x0 = Math.round(left + 6 - 6 * t), x1 = Math.round(right - 6 + 6 * t);
    c.rect(x0, y, x1 - x0, 1, y === d.y - 22 ? 'navyMid' : 'navy');
  }
  c.rect(left + 6, d.y - 22, 78, 1, 'navyMid');
  c.rect(left - 1, d.y - 13, 86, 3, 'red'); // the red fascia at the front of the roof
  c.rect(left - 1, d.y - 13, 86, 1, 'redLight');
  c.rect(left - 1, d.y - 11, 86, 1, 'redDark');
  c.rect(left + 1, d.y - 10, 82, 21, 'navyDark'); // inside
  for (let x = left + 7; x < right - 4; x += 9) c.rect(x, d.y - 10, 1, 15, 'navy'); // planks on the back wall
  c.rect(left + 1, d.y - 10, 82, 2, 'black'); // the shadow under the roof
  for (let i = 0; i < 4; i++) c.line(left + 8 + i * 4, d.y - 5, left + 6 + i * 4, d.y + 3, 'wood', 2); // bat rack
  c.rect(left + 4, d.y + 3, 18, 2, 'wood');
  c.rect(left + 1, d.y + 2, 82, 3, 'red'); // the bench
  c.rect(left + 1, d.y + 2, 82, 1, 'redLight');
  c.rect(left + 1, d.y + 5, 82, 1, 'redDark');
  for (const x of [left + 4, d.x - 2, right - 8]) c.rect(x, d.y + 6, 3, 5, 'wood'); // bench legs
  ellipse(d.x + 4, d.y - 1, 6, 4, 'navy', (x, y) => y <= d.y + 1); // two helmets on the bench
  ellipse(d.x + 22, d.y - 1, 6, 4, 'red', (x, y) => y <= d.y + 1);
  c.rect(d.x + 1, d.y - 3, 3, 1, 'navyMid');
  c.rect(right - 12, d.y - 8, 9, 10, 'sky'); // water cooler
  c.rect(right - 12, d.y - 9, 9, 2, 'white');
  c.rect(right - 10, d.y - 4, 5, 2, 'skyLight');
  c.set(right - 3, d.y - 2, 'red');
  c.rect(left - 1, d.y + 11, 86, 3, 'grey'); // the rail in front
  c.rect(left - 1, d.y + 11, 86, 1, 'greyLight');
  for (let x = left; x < right; x += 9) c.rect(x, d.y + 14, 2, 3, 'greyDark');

  // --- Bullpen for later (Multisensory): a bench, a low fence and a small mound, only decoration -----------------
  const bx = 432, by = 214;
  c.rect(bx - 22, by - 14, 50, 2, 'greyLight'); // fence
  for (let x = bx - 22; x <= bx + 26; x += 8) c.rect(x, by - 14, 2, 8, 'grey');
  c.rect(bx - 20, by - 3, 36, 4, 'wood'); // bench with a back
  c.rect(bx - 20, by - 3, 36, 1, 'dirtLight');
  c.rect(bx - 20, by - 9, 36, 3, 'wood');
  c.rect(bx - 18, by + 1, 3, 5, 'wood'); c.rect(bx + 11, by + 1, 3, 5, 'wood');
  ellipse(bx + 10, by + 24, 14, 6, 'dirtDark');
  ellipse(bx + 10, by + 23, 13, 5, 'dirt');
  c.rect(bx + 5, by + 22, 7, 1, 'white');

  await c.png(out('field.png'));
}
