// 24×24 icons for the points of the stadium, in one strip of 168×24 (order = STOPS, then SPOTS in src/field-map.js):
//   home plate · Nipotyno (phone with the assistant) · Levante (sensor buoy) · Sensor lab (flask)
//   · About (scoreboard) · How I design (pitcher's mound with a ball) · Contact & CV (a ticket)
// Drawn with shapes in the site palette; every icon gets a 1 px dark outline so it reads on any background.
import { canvas } from './canvas.js';
import { STOPS, SPOTS } from '../../src/field-map.js';

const CELL = 24;

function ellipse(cx, cy, rx, ry, paint, where = () => true) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 && where(x, y)) paint(x, y);
    }
  }
}

export const ICONS = {
  // A white home plate on a patch of dirt.
  home(c, ox) {
    const set = (x, y, color) => c.set(ox + x, y, color);
    ellipse(12, 14, 10.5, 8, (x, y) => set(x, y, 'dirt'));
    ellipse(12, 14, 10.5, 8, (x, y) => set(x, y, 'dirtDark'), (x, y) => y >= 19);
    ellipse(12, 14, 10.5, 8, (x, y) => set(x, y, 'dirtLight'), (x, y) => y <= 9);
    c.rect(ox + 5, 6, 14, 7, 'white');
    for (let i = 0; i < 7; i++) c.rect(ox + 5 + i, 13 + i, 14 - 2 * i, 1, 'white');
    c.rect(ox + 5, 6, 14, 1, 'white');
    c.rect(ox + 17, 7, 2, 6, 'greyLight');
    c.rect(ox + 5, 12, 14, 1, 'greyLight');
  },
  // A phone with the digital mentor: avatar, a chat bubble and the home button.
  nipotyno(c, ox) {
    c.rect(ox + 6, 1, 12, 22, 'navy');
    c.rect(ox + 6, 2, 1, 20, 'navyMid');
    c.rect(ox + 7, 3, 10, 17, 'skyLight');
    c.rect(ox + 7, 3, 10, 3, 'sky');
    c.rect(ox + 10, 7, 5, 2, 'yellow'); // hair
    c.rect(ox + 10, 9, 5, 4, 'skin');
    c.set(ox + 11, 10, 'black'); c.set(ox + 13, 10, 'black');
    c.rect(ox + 11, 12, 3, 1, 'redDark');
    c.rect(ox + 8, 14, 8, 4, 'red'); // chat bubble
    c.set(ox + 9, 18, 'red');
    for (const x of [10, 12, 14]) c.set(ox + x, 16, 'white');
    c.rect(ox + 10, 21, 4, 1, 'greyLight');
    c.rect(ox + 7, 19, 10, 1, 'white');
  },
  // A solar-powered sensing buoy floating on the sea.
  levante(c, ox) {
    c.rect(ox, 15, CELL, 8, 'sky');
    for (const [x, y, w] of [[1, 16, 5], [9, 18, 6], [17, 16, 5], [3, 20, 6], [14, 21, 7]]) c.rect(ox + x, y, w, 1, 'skyLight');
    for (const [x, y] of [[7, 17], [19, 19], [2, 22]]) c.set(ox + x, y, 'white');
    c.rect(ox, 22, CELL, 1, 'navyMid');
    c.line(ox + 12, 1, ox + 12, 5, 'grey'); // antenna
    c.set(ox + 12, 0, 'redLight');
    c.rect(ox + 7, 5, 11, 2, 'navyMid'); // solar panel
    for (const x of [10, 13, 16]) c.set(ox + x, 5, 'skyLight');
    ellipse(12, 11, 6.5, 5.5, (x, y) => c.set(ox + x, y, 'yellow'), (x, y) => y <= 15);
    ellipse(12, 11, 6.5, 5.5, (x, y) => c.set(ox + x, y, 'dirt'), (x, y) => y <= 15 && x >= 16);
    c.rect(ox + 10, 9, 5, 3, 'navy'); // window
    c.rect(ox + 11, 10, 3, 1, 'skyLight');
    c.rect(ox + 6, 14, 13, 1, 'red'); // waterline band
    c.line(ox + 12, 17, ox + 12, 21, 'grey'); // the cable down to the sensor
  },
  // A lab flask with a cork, bubbles and a blue liquid.
  'sensor-lab'(c, ox) {
    c.rect(ox + 8, 0, 8, 2, 'wood'); // cork
    c.rect(ox + 9, 2, 6, 7, 'white');
    c.rect(ox + 10, 2, 4, 7, 'skyLight');
    for (let y = 9; y <= 20; y++) {
      const half = 3 + Math.floor((y - 9) * 0.55);
      c.rect(ox + 12 - half, y, half * 2, 1, 'white');
      c.rect(ox + 13 - half, y, half * 2 - 2, 1, y >= 13 ? 'sky' : 'skyLight');
    }
    for (let y = 14; y <= 20; y++) c.set(ox + 17 - Math.floor((y - 14) * 0.5), y, 'skyLight'); // a light streak on the glass
    c.rect(ox + 8, 13, 9, 1, 'white'); // the surface of the liquid
    for (const [x, y] of [[10, 16], [13, 18], [15, 15]]) c.rect(ox + x, y, 1, 1, 'white');
    c.rect(ox + 4, 21, 16, 2, 'greyLight');
    c.rect(ox + 4, 22, 16, 1, 'grey');
    c.line(ox + 10, 3, ox + 10, 7, 'white');
  },
  // The scoreboard: lights, two rows of numbers, a red band (About = the player's stats).
  about(c, ox) {
    c.rect(ox + 2, 3, 20, 16, 'navy');
    c.rect(ox + 2, 3, 20, 1, 'navyMid');
    c.rect(ox + 4, 5, 16, 12, 'navyDark');
    for (const x of [5, 9, 13, 17]) c.rect(ox + x, 6, 2, 2, x < 13 ? 'yellow' : 'greyDark');
    c.rect(ox + 6, 10, 3, 4, 'white'); c.rect(ox + 7, 11, 1, 2, 'navyDark'); // a "0"
    c.rect(ox + 11, 10, 1, 4, 'white'); // a "1"
    c.rect(ox + 14, 10, 4, 1, 'white'); c.rect(ox + 17, 10, 1, 4, 'white'); // a "7"
    c.rect(ox + 4, 15, 16, 1, 'red');
    c.rect(ox + 11, 19, 2, 4, 'navy'); // the post
    c.rect(ox + 7, 22, 10, 1, 'navy');
  },
  // The pitcher's mound with the rubber and a ball above it (How I design: where every play starts).
  how(c, ox) {
    ellipse(12, 18, 11, 4.5, (x, y) => c.set(ox + x, y, 'dirtDark'));
    ellipse(12, 17, 10, 4, (x, y) => c.set(ox + x, y, 'dirt'));
    ellipse(10, 16, 6, 2, (x, y) => c.set(ox + x, y, 'dirtLight'));
    c.rect(ox + 9, 16, 6, 1, 'white');
    ellipse(12, 7, 5, 5, (x, y) => c.set(ox + x, y, 'white')); // the ball
    for (const [x, y] of [[9, 4], [9, 6], [9, 8], [10, 10], [15, 4], [15, 6], [15, 8], [14, 10]]) c.set(ox + x, y, 'red'); // stitches
    c.set(ox + 10, 4, 'greyLight'); c.set(ox + 11, 3, 'greyLight');
  },
  // A ticket with a perforated stub (Contact & CV: the ticket booth).
  contact(c, ox) {
    c.rect(ox + 1, 6, 22, 12, 'yellow');
    c.rect(ox + 1, 6, 22, 1, 'white');
    c.rect(ox + 1, 17, 22, 1, 'dirt');
    for (let y = 7; y < 17; y += 2) c.set(ox + 16, y, 'dirtDark'); // perforation
    c.rect(ox + 3, 9, 11, 2, 'red'); // "ADMIT ONE"
    c.rect(ox + 3, 12, 8, 1, 'dirtDark');
    c.rect(ox + 3, 14, 10, 1, 'dirtDark');
    c.rect(ox + 18, 10, 3, 4, 'red'); // the stub's number
    c.set(ox + 1, 11, 'navyDark'); c.set(ox + 1, 12, 'navyDark'); // notches
    c.set(ox + 22, 11, 'navyDark'); c.set(ox + 22, 12, 'navyDark');
  },
};

export async function icons(out) {
  const points = [...STOPS, ...SPOTS];
  const c = canvas(CELL * points.length, CELL);
  points.forEach((stop, i) => {
    ICONS[stop.id](c, i * CELL);
    c.outline('navyDark', { x: i * CELL, y: 0, w: CELL, h: CELL });
  });
  await c.png(out('icons.png'));
}
