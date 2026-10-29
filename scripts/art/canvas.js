// Tiny pixel canvas used by the art scripts: set pixels by palette name, then save as PNG.
import sharp from 'sharp';
import { PALETTE, RAMPS } from '../../src/palette.js';
import { GLYPHS } from './title.js';

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function canvas(width, height) {
  const data = Buffer.alloc(width * height * 4); // starts fully transparent

  const set = (x, y, color) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    if (!PALETTE[color]) throw new Error(`colour not in palette: ${color}`);
    data.set([...rgb(PALETTE[color]), 255], (y * width + x) * 4);
  };
  const isSet = (x, y) => x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] > 0;
  const rect = (x, y, w, h, color) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) set(i, j, color); };

  // Straight line; `size` > 1 draws a thick line (a size×size square at every step).
  const line = (x0, y0, x1, y1, color, size = 1) => {
    const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
    const off = Math.floor((size - 1) / 2);
    for (let s = 0; s <= steps; s++) {
      const x = Math.round(x0 + ((x1 - x0) * s) / steps), y = Math.round(y0 + ((y1 - y0) * s) / steps);
      rect(x - off, y - off, size, size, color);
    }
  };

  // Draw a text map: one character per pixel, `key` maps characters to palette names ('.' = empty).
  const map = (x, y, rows, key, { flip = false } = {}) => {
    const lines = rows.trim().split('\n').map((r) => r.trim());
    lines.forEach((row, j) => [...row].forEach((ch, i) => {
      if (key[ch]) set(flip ? x + row.length - 1 - i : x + i, y + j, key[ch]);
    }));
  };

  // 1-pixel outline around everything drawn in the area, for a readable sprite on any background.
  const outline = (color, area = { x: 0, y: 0, w: width, h: height }) => {
    const add = [];
    for (let y = area.y; y < area.y + area.h; y++) {
      for (let x = area.x; x < area.x + area.w; x++) {
        if (isSet(x, y)) continue;
        const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          return nx >= area.x && ny >= area.y && nx < area.x + area.w && ny < area.y + area.h && isSet(nx, ny);
        });
        if (near) add.push([x, y]);
      }
    }
    for (const [x, y] of add) set(x, y, color);
  };

  // Selective outline (F6): every empty pixel next to the drawing takes the darkest tone of the ramp of the part it
  // touches, one tone lighter on the lit side (light comes from the top left, so the outline above and to the left of a
  // part is lighter). Colours outside the four ramps use OUTLINE below. Never pure black.
  const outlineByRamp = (area = { x: 0, y: 0, w: width, h: height }) => {
    const add = [];
    for (let y = area.y; y < area.y + area.h; y++) {
      for (let x = area.x; x < area.x + area.w; x++) {
        if (isSet(x, y)) continue;
        // neighbours below and to the right = this pixel is on the lit side of that part
        for (const [dx, dy, lit] of [[0, 1, true], [1, 0, true], [0, -1, false], [-1, 0, false]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < area.x || ny < area.y || nx >= area.x + area.w || ny >= area.y + area.h || !isSet(nx, ny)) continue;
          const [dark, light] = outlineOf(nameAt(nx, ny));
          add.push([x, y, lit ? light : dark]);
          break;
        }
      }
    }
    for (const [x, y, color] of add) set(x, y, color);
  };
  const nameAt = (x, y) => {
    const i = (y * width + x) * 4;
    return BY_RGB.get(`${data[i]},${data[i + 1]},${data[i + 2]}`);
  };

  // Swap colours by name over the whole picture (the night version of the field, F6).
  const remap = (swap) => {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (!isSet(x, y)) continue;
        const to = swap(nameAt(x, y), x, y);
        if (to) set(x, y, to);
      }
    }
  };

  // Text in the 5×7 pixel font of the title (scripts/art/title.js), `scale` pixels per font pixel; letters are 6 pixels apart.
  const text = (str, x, y, color, scale = 1) => {
    [...str.toUpperCase()].forEach((ch, n) => GLYPHS[ch].split('|').forEach((row, j) => [...row].forEach((p, i) => {
      if (p === '#') rect(x + (n * 6 + i) * scale, y + j * scale, scale, scale, color);
    })));
  };

  const png = (file) => sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(file);
  // Lossless WebP at `scale`× with nearest neighbour: sharp pixels and exactly the palette colours.
  const webp = (file, scale = 1) => sharp(data, { raw: { width, height, channels: 4 } })
    .resize(width * scale, height * scale, { kernel: 'nearest' }).webp({ lossless: true }).toFile(file);
  return { width, height, set, isSet, rect, line, map, outline, outlineByRamp, remap, nameAt, text, png, webp };
}

const BY_RGB = new Map(Object.entries(PALETTE).map(([name, hex]) => [rgb(hex).join(), name]));
// [outline, outline on the lit side] for every colour: its ramp's darkest tone, or a dark tone of the same family.
const OUTLINE = {
  ...Object.fromEntries(Object.values(RAMPS).flatMap((ramp) => ramp.map((name) => [name, [ramp[0], ramp[1]]]))),
  sky: ['navyDark', 'navy'], skyLight: ['navyMid', 'navyLight'],
  white: ['navyMid', 'navyLight'], greyLight: ['greyDark', 'grey'], grey: ['greyDark', 'greyDark'], greyDark: ['navyDark', 'navy'],
  black: ['skinDeep', 'hair'], hair: ['skinDeep', 'black'], wood: ['skinDeep', 'hair'],
  dirt: ['skinDeep', 'dirtDark'], dirtDark: ['skinDeep', 'wood'], dirtLight: ['dirtDark', 'dirt'],
  yellow: ['wood', 'dirtDark'], night: ['navyDark', 'navyDark'],
};
const outlineOf = (name) => OUTLINE[name] ?? ['navyDark', 'navy'];

// Same "random" numbers on every run, so the art never changes unless the code does.
export function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
