import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { PALETTE } from '../src/palette.js';

// The pixel art in public/game/ (made by `npm run art`) must follow the rules of B4.
const allowed = new Set(Object.values(PALETTE));
const hex = (r, g, b) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

async function colours(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const found = new Set();
  for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0) found.add(hex(data[i], data[i + 1], data[i + 2]));
  return { found, info };
}

test('palette has exactly 24 colours (16 + 8 added for the 480×270 art)', () => {
  expect(allowed.size).toBe(24);
});

for (const [file, size] of [['field.png', [480, 270]], ['runner.png', [720, 144]], ['crew.png', [384, 192]], ['icons.png', [120, 24]]]) {
  test(`${file}: ${size.join('×')} and only palette colours`, async () => {
    const { found, info } = await colours(`public/game/${file}`);
    expect([info.width, info.height]).toEqual(size);
    expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
  });
}

test('Lab cover: 640×480 (160×120 at 4×), original, only palette colours', async () => {
  const { found, info } = await colours('public/assets/lab/cover.webp');
  expect([info.width, info.height]).toEqual([640, 480]);
  expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
  // pixel art at 4×: every 4×4 block is one colour, so the image has at most 160×120 distinct cells
  const { data } = await sharp('public/assets/lab/cover.webp').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (const [x, y] of [[3, 3], [100, 77], [401, 250], [637, 477]]) {
    const at = (px, py) => data.subarray((py * 640 + px) * 4, (py * 640 + px) * 4 + 4).join();
    const bx = x - (x % 4), by = y - (y % 4);
    expect(at(bx + 3, by + 3)).toBe(at(bx, by));
  }
});

test('runner.json describes 15 frames of 48×48: idle, run, swing, high five, cheer, wave', async () => {
  const sheet = JSON.parse(await readFile('public/game/runner.json', 'utf8'));
  expect(sheet.frames).toHaveLength(15);
  expect(sheet.frames.every((f) => f.frame.w === 48 && f.frame.h === 48)).toBe(true);
  expect(sheet.meta.size).toEqual({ w: 720, h: 144 });
  expect(sheet.meta.frameTags.map((t) => [t.name, t.from, t.to])).toEqual([
    ['idle', 0, 1], ['run', 2, 5], ['swing', 6, 9], ['highfive', 10, 10], ['cheer', 11, 12], ['wave', 13, 14],
  ]);
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
