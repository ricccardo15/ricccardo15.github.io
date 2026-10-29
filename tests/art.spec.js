import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { PALETTE, RAMPS } from '../src/palette.js';

// The pixel art in public/game/ (made by `npm run art`) must follow the rules of B4.
const allowed = new Set(Object.values(PALETTE));
const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

async function colours(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const found = new Set();
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0) found.add(hex(data[i], data[i + 1], data[i + 2]));
  return { found, info };
}

test('palette has exactly 34 colours (16 + 8 for the 480×270 art + 10 for the F6 ramps and the night sky)', () => {
  expect(allowed.size).toBe(34);
});

// F6: four ramps of 5 tones, darkest first, with the exact colours of the plan (docs/PROMPT_V3.md).
// The plan also says "max 20° of hue per step", but its own colours move more (red 328°→3°, grass 164°→122°): the exact
// colours win, so the test checks the order and the values, not the hue steps (DECISIONS.md, F6).
const lum = (hexColor) => [1, 3, 5].reduce((sum, i, k) => sum + parseInt(hexColor.slice(i, i + 2), 16) * [0.2126, 0.7152, 0.0722][k], 0);
test('F6 ramps: red, navy, grass and skin have 5 tones each, from dark to light', () => {
  expect(Object.keys(RAMPS)).toEqual(['red', 'navy', 'grass', 'skin']);
  for (const [name, ramp] of Object.entries(RAMPS)) {
    expect(ramp, name).toHaveLength(5);
    const hexes = ramp.map((tone) => PALETTE[tone]);
    for (let i = 1; i < 5; i++) expect(lum(hexes[i]), `${name} ${i}`).toBeGreaterThan(lum(hexes[i - 1]));
  }
  expect(RAMPS.red.map((t) => PALETTE[t])).toEqual(['#5a1238', '#8a1c16', '#b3261e', '#e0533f', '#f5925a']);
  expect(RAMPS.navy.map((t) => PALETTE[t])).toEqual(['#0f1a30', '#1b2a4a', '#2c4170', '#4a6aa0', '#8fb0d8']);
  expect(RAMPS.grass.map((t) => PALETTE[t])).toEqual(['#1f5a4a', '#2f7d32', '#3f9b3a', '#5db648', '#a8d65a']);
  expect(RAMPS.skin.map((t) => PALETTE[t])).toEqual(['#5e3a3a', '#a8704f', '#d9a07a', '#eebd92', '#f8dcb4']);
});

test('F6 selective outline: the edge of the runner uses several ramp tones, never one flat dark colour', async () => {
  const { data, info } = await sharp('public/game/runner.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const edge = new Set();
  const opaque = (x, y) => x >= 0 && y >= 0 && x < info.width && y < info.height && data[(y * info.width + x) * 4 + 3] > 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (!opaque(x, y)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !opaque(x + dx, y + dy))) {
      const i = (y * info.width + x) * 4;
      edge.add(hex(data[i], data[i + 1], data[i + 2]));
    }
  }
  expect(edge.size).toBeGreaterThanOrEqual(6);
  expect(edge.has('#000000')).toBe(false);
});

for (const [file, size] of [['field.png', [480, 270]], ['night.png', [480, 270]], ['runner.png', [864, 144]], ['crew.png', [384, 192]], ['icons.png', [168, 24]]]) {
  test(`${file}: ${size.join('×')} and only palette colours`, async () => {
    const { found, info } = await colours(`public/game/${file}`);
    expect([info.width, info.height]).toEqual(size);
    expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
  });
}

test('Sensor lab placeholder cover: 640×480 (160×120 at 4×), original, only palette colours', async () => {
  const { found, info } = await colours('public/assets/sensor-lab/cover.webp');
  expect([info.width, info.height]).toEqual([640, 480]);
  expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
  // pixel art at 4×: every 4×4 block is one colour, so the image has at most 160×120 distinct cells
  const { data } = await sharp('public/assets/sensor-lab/cover.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [x, y] of [[3, 3], [100, 77], [401, 250], [637, 477]]) {
    const at = (px, py) => data.subarray((py * 640 + px) * 4, (py * 640 + px) * 4 + 4).join();
    const bx = x - (x % 4), by = y - (y % 4);
    expect(at(bx + 3, by + 3)).toBe(at(bx, by));
  }
});

test('runner.json describes 18 frames of 48×48: idle (4), blink, run, swing (4), high five, cheer, wave', async () => {
  const sheet = JSON.parse(await readFile('public/game/runner.json', 'utf8'));
  expect(sheet.frames).toHaveLength(18);
  expect(sheet.frames.every((f) => f.frame.w === 48 && f.frame.h === 48)).toBe(true);
  expect(sheet.meta.size).toEqual({ w: 864, h: 144 });
  expect(sheet.meta.frameTags.map((t) => [t.name, t.from, t.to])).toEqual([
    ['idle', 0, 3], ['blink', 4, 4], ['run', 5, 8], ['swing', 9, 12], ['highfive', 13, 13], ['cheer', 14, 15], ['wave', 16, 17],
  ]);
});

test('night.png: same size as field.png, the sky is the night of the page, the towers are lit', async () => {
  const { data } = await sharp('public/game/night.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => hex(...data.subarray((y * 480 + x) * 4, (y * 480 + x) * 4 + 3));
  expect([at(150, 12), at(151, 12)]).toContain('#0b0f1e'); // sky (dithered with navyDark near the stands)
  expect(at(37, 2)).toBe(PALETTE.yellow); // a lamp of the left tower
  const day = await sharp('public/game/field.png').metadata();
  expect([day.width, day.height]).toEqual([480, 270]);
});

test('PNG weight: every sheet stays light', async () => {
  for (const [file, max] of [['field.png', 40_000], ['night.png', 40_000], ['runner.png', 25_000], ['crew.png', 15_000]]) {
    expect((await sharp(`public/game/${file}`).toBuffer()).length, file).toBeLessThan(max);
  }
});

test('crew.json describes 8 frames of 48×48: idle, high five, cheer, pitch', async () => {
  const sheet = JSON.parse(await readFile('public/game/crew.json', 'utf8'));
  expect(sheet.frames).toHaveLength(8);
  expect(sheet.frames.every((f) => f.frame.w === 48 && f.frame.h === 48)).toBe(true);
  expect(sheet.meta.size).toEqual({ w: 384, h: 192 });
  expect(sheet.meta.frameTags.map((t) => [t.name, t.from, t.to])).toEqual([['idle', 0, 1], ['highfive', 2, 2], ['cheer', 3, 4], ['pitch', 5, 7]]);
});

test('title.svg uses only palette colours', async () => {
  const svg = await readFile('public/game/title.svg', 'utf8');
  const fills = [...svg.matchAll(/fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
  expect(fills.length).toBeGreaterThan(0);
  expect(fills.filter((c) => !allowed.has(c))).toEqual([]);
});
