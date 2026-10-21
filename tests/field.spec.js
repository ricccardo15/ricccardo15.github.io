import { test, expect } from '@playwright/test';
import { STOPS, SAFE, FIELD } from '../src/field-map.js';

// Fase 1: the 480×270 field is always shown at a whole-number scale; on a phone it is cropped around the middle,
// so everything a visitor can click has to stay inside the part that remains visible (x = 64 … 416).
const sizes = [
  { width: 1280, height: 800, scale: 2 },
  { width: 1440, height: 900, scale: 2 },
  { width: 1536, height: 730, scale: 2 },
  { width: 1000, height: 800, scale: 2 },
  { width: 999, height: 800, scale: 1 },
  { width: 800, height: 700, scale: 1 },
  { width: 520, height: 800, scale: 1 },
  { width: 390, height: 844, scale: 1 },
  { width: 320, height: 640, scale: 1 },
];

for (const { width, height, scale } of sizes) {
  test.describe(`field @ ${width}×${height}`, () => {
    test.use({ viewport: { width, height } });

    test(`is shown at ${scale}× (the picture is ${FIELD.width * scale} px wide) and the sprites follow`, async ({ page }) => {
      await page.goto('/');
      const img = await page.locator('.field-img').boundingBox();
      expect(img.width).toBe(FIELD.width * scale);
      expect(img.height).toBe(FIELD.height * scale);
      const runner = await page.locator('.runner').boundingBox();
      expect([runner.width, runner.height]).toEqual([48 * scale, 48 * scale]); // 48 px cells at the same scale
      expect(await page.locator('.field').evaluate((el) => getComputedStyle(el).getPropertyValue('--fs').trim())).toBe(String(scale));
    });

    test('the stage fits the screen, is centred, and the picture is centred in it (cropped on phones)', async ({ page }) => {
      await page.goto('/');
      const stage = await page.locator('.stage').boundingBox();
      const img = await page.locator('.field-img').boundingBox();
      expect(stage.x).toBeGreaterThanOrEqual(0);
      expect(stage.x + stage.width).toBeLessThanOrEqual(width);
      // the picture sits in the middle of the stage: what is cut off on the left equals what is cut off on the right
      const cutLeft = stage.x - img.x;
      const cutRight = img.x + img.width - (stage.x + stage.width);
      expect(Math.abs(cutLeft - cutRight)).toBeLessThanOrEqual(1);
      if (img.width <= stage.width) expect(cutLeft).toBeLessThanOrEqual(0); // nothing cropped
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  });
}

test('every stop a visitor can click is inside the phone crop (x between 64 and 416)', () => {
  for (const stop of STOPS) {
    expect(stop.x, stop.id).toBeGreaterThanOrEqual(SAFE.left);
    expect(stop.x, stop.id).toBeLessThanOrEqual(SAFE.right);
  }
});

for (const { width, height } of [{ width: 390, height: 844 }, { width: 320, height: 640 }, { width: 800, height: 700 }, { width: 1280, height: 800 }]) {
  test.describe(`bases @ ${width}×${height}`, () => {
    test.use({ viewport: { width, height } });

    // In every language (Fase 3): the Spanish and Italian labels are longer.
    for (const home of ['/', '/es/', '/it/']) test(`${home}: every base label is completely inside the visible field, and no two labels overlap`, async ({ page }) => {
      await page.goto(home);
      const stage = await page.locator('.stage').boundingBox();
      const boxes = [];
      for (const base of await page.locator('.base').all()) {
        const box = await base.boundingBox();
        boxes.push([await base.getAttribute('data-stop'), box]);
        expect(box.x, `${await base.getAttribute('data-stop')} left`).toBeGreaterThanOrEqual(stage.x);
        expect(box.x + box.width, `${await base.getAttribute('data-stop')} right`).toBeLessThanOrEqual(stage.x + stage.width);
        expect(box.y, `${await base.getAttribute('data-stop')} top`).toBeGreaterThanOrEqual(stage.y);
        expect(box.y + box.height, `${await base.getAttribute('data-stop')} bottom`).toBeLessThanOrEqual(stage.y + stage.height);
      }
      for (const [i, [a, boxA]] of boxes.entries()) {
        for (const [b, boxB] of boxes.slice(i + 1)) {
          const apart = boxA.x + boxA.width <= boxB.x || boxB.x + boxB.width <= boxA.x || boxA.y + boxA.height <= boxB.y || boxB.y + boxB.height <= boxA.y;
          expect(apart, `${a} and ${b} overlap`).toBe(true);
        }
      }
    });
  });
}

test.describe('Fase 1 art in the page', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the sprite sheets load at their real size and the big batter shows a 48 px frame', async ({ page, request }) => {
    await page.goto('/');
    for (const [file, w, h] of [['field.png', 480, 270], ['runner.png', 720, 144], ['crew.png', 384, 192], ['icons.png', 192, 24]]) {
      const size = await page.evaluate((src) => new Promise((resolve) => { const i = new Image(); i.onload = () => resolve([i.naturalWidth, i.naturalHeight]); i.src = src; }), `/game/${file}`);
      expect(size, file).toEqual([w, h]);
    }
    const batter = await page.locator('.batter').boundingBox();
    expect([batter.width, batter.height]).toEqual([48 * 5, 48 * 5]); // 5× in the lobby at this width
    expect((await request.get('/og/home.jpg')).status()).toBe(200);
  });

  test('the Uniform picked on the start screen shows on the field (a row of the 48 px sheet)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.uniform-tiles').getByText('Maker', { exact: true }).click();
    const position = await page.locator('.runner').evaluate((el) => getComputedStyle(el).backgroundPositionY);
    expect(position).toBe(`${-48 * 2 * 2}px`); // row 2 at 2×
  });
});
