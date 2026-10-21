// Tiny pixel canvas used by the art scripts: set pixels by palette name, then save as PNG.
import sharp from 'sharp';
import { PALETTE } from '../../src/palette.js';

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

  const png = (file) => sharp(data, { raw: { width, height, channels: 4 } }).png().toFile(file);
  // Lossless WebP at `scale`× with nearest neighbour: sharp pixels and exactly the palette colours.
  const webp = (file, scale = 1) => sharp(data, { raw: { width, height, channels: 4 } })
    .resize(width * scale, height * scale, { kernel: 'nearest' }).webp({ lossless: true }).toFile(file);
  return { width, height, set, isSet, rect, line, map, outline, png, webp };
}

// Same "random" numbers on every run, so the art never changes unless the code does.
export function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}
