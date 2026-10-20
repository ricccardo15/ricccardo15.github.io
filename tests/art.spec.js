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

test('palette has exactly 16 colours', () => {
  expect(allowed.size).toBe(16);
});

for (const [file, size] of [['field.png', [320, 180]], ['runner.png', [320, 32]], ['icons.png', [80, 16]]]) {
  test(`${file}: ${size.join('×')} and only palette colours`, async () => {
    const { found, info } = await colours(`public/game/${file}`);
    expect([info.width, info.height]).toEqual(size);
    expect([...found].filter((c) => !allowed.has(c))).toEqual([]);
  });
}

test('runner.json describes 10 frames: idle, run, swing', async () => {
  const sheet = JSON.parse(await readFile('public/game/runner.json', 'utf8'));
  expect(sheet.frames).toHaveLength(10);
  expect(sheet.meta.frameTags.map((t) => [t.name, t.from, t.to])).toEqual([['idle', 0, 1], ['run', 2, 5], ['swing', 6, 9]]);
});

test('title.svg uses only palette colours', async () => {
  const svg = await readFile('public/game/title.svg', 'utf8');
  const fills = [...svg.matchAll(/fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);
  expect(fills.length).toBeGreaterThan(0);
  expect(fills.filter((c) => !allowed.has(c))).toEqual([]);
});
