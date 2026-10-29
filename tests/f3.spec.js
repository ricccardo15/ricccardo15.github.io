import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdir, stat } from 'node:fs/promises';

// F3 (v3): Jersey 10 + Atkinson Hyperlegible Next/Mono, self-hosted; two colour themes, night and paper.
const FAMILIES = ['Jersey 10', 'Atkinson Hyperlegible Next', 'Atkinson Hyperlegible Mono'];

test('the three font families load (self-hosted, no third-party request)', async ({ page }) => {
  const outside = [];
  page.on('request', (req) => { if (!req.url().startsWith('http://localhost')) outside.push(req.url()); });
  await page.goto('/nipotyno/');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
  for (const family of FAMILIES) expect(loaded, family).toContain(family);
  // the weights this page uses: Jersey 400, Atkinson Next 400, Atkinson Mono 700 (the small labels)
  for (const [font, family] of [['16px', FAMILIES[0]], ['16px', FAMILIES[1]], ['bold 16px', FAMILIES[2]]]) {
    expect(await page.evaluate((f) => document.fonts.check(f), `${font} "${family}"`), family).toBe(true);
  }
  expect(outside).toEqual([]);
  // the two fonts of the first screen are preloaded
  await expect(page.locator('link[rel="preload"][as="font"]')).toHaveCount(2);
});

test('the fonts weigh less than 80 KB in total, and the OFL licence is published', async ({ request }) => {
  const files = (await readdir('dist/fonts')).filter((f) => f.endsWith('.woff2'));
  expect(files).toHaveLength(6);
  let bytes = 0;
  for (const f of files) bytes += (await stat(`dist/fonts/${f}`)).size;
  expect(bytes).toBeLessThan(80 * 1024);
  const ofl = await request.get('/fonts/OFL.txt');
  expect(ofl.status()).toBe(200);
  expect(await ofl.text()).toContain('SIL Open Font License');
});

test('Jersey 10 only for titles: reading text is Atkinson Hyperlegible Next', async ({ page }) => {
  await page.goto('/levante/');
  expect(await page.locator('h1').evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Jersey 10/);
  for (const sel of ['.case p', '.case li', '.facts dd']) {
    expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).fontFamily), sel).toMatch(/^"?Atkinson Hyperlegible Next/);
  }
  expect(await page.locator('.kicker').first().evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Atkinson Hyperlegible Mono/);
});

test('themes: cases are paper, the stadium is night; colour contrast passes in both', async ({ page }) => {
  for (const [path, selector, theme, bg] of [
    ['/nipotyno/', 'body', 'paper', 'rgb(246, 242, 234)'],
    ['/', '#field', 'night', 'rgb(11, 15, 30)'],
  ]) {
    await page.goto(path);
    await expect(page.locator(selector)).toHaveAttribute('data-theme', theme);
    expect(await page.locator(selector).evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(bg);
    const results = await new AxeBuilder({ page }).include(selector).withRules(['color-contrast']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`), path).toEqual([]);
  }
});

test('frames are square: no rounded corners on cards and buttons', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['.button', '.player-card', '.panel', '.stage']) {
    expect(await page.locator(sel).first().evaluate((el) => getComputedStyle(el).borderTopLeftRadius), sel).toBe('0px');
  }
});

test.describe('titles with accents @ 390 px', () => {
  test.use({ viewport: { width: 390, height: 844 } });
  for (const path of ['/es/nipotyno/', '/es/levante/', '/it/nipotyno/', '/it/levante/', '/es/sensor-lab/']) {
    test(`${path}: no title spills out of its box`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const spilled = await page.locator('h1, h2').evaluateAll((els) => els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent));
      expect(spilled).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }
});
