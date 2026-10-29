import { test, expect } from '@playwright/test';
import { STOPS } from '../src/field-map.js';

// The stadium on /play/ (F4) with the F5 rules: four points only (1st Nipotyno, 2nd Levante, 3rd Sensor lab, home plate =
// Multiplayer); the scoreboard, the mound and the ticket booth are scenery. A card opens over the stadium (a drawer on desktop,
// under the stage on phones); ✕ Close closes it and the focus goes back to the point. Without JS: plain links.
const card = (page) => page.locator('#field-panel [data-panel]:visible');
const enter = async (page) => { await page.goto('/play/'); };
const skip = (page) => page.getByRole('button', { name: /^Skip/ });
const overlap = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

test.describe('stadium @ 1280×800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('/play/ shows the whole stage on the first screen, the card is closed, Swing! sits under home plate and covers no label', async ({ page }) => {
    await enter(page);
    await skip(page).click();
    await expect(page.locator('.stage')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#field-panel')).toBeHidden();
    const stage = await page.locator('.stage').boundingBox();
    const swing = await page.locator('.swing-box').boundingBox();
    expect(swing.x >= stage.x && swing.x + swing.width <= stage.x + stage.width && swing.y + swing.height <= stage.y + stage.height).toBe(true);
    for (const base of await page.locator('.base').all()) expect(overlap(swing, await base.boundingBox()), await base.getAttribute('href')).toBe(false);
  });

  test('F5: only the four bases are points; the scoreboard, the mound and the ticket booth are scenery', async ({ page }) => {
    await enter(page);
    await expect(page.locator('.stage .base')).toHaveCount(STOPS.length);
    await expect(page.locator('[data-spot]')).toHaveCount(0);
    await expect(page.locator('.stage .base[data-stop="home"]')).toContainText('Contact & CV');
  });

  test('home plate = Multiplayer: email and the two CVs; ✕ Close closes it and the focus goes back', async ({ page }) => {
    await enter(page);
    const link = page.locator('.stage [data-stop="home"]');
    await link.click();
    await expect(card(page)).toHaveAttribute('data-panel', 'home');
    await expect(card(page).locator('a[href^="mailto:"]')).toBeVisible();
    await expect(card(page).getByRole('link', { name: 'CV en español (PDF)' })).toHaveAttribute('lang', 'es');
    await expect(card(page).getByRole('link', { name: /Multiplayer/ })).toHaveAttribute('href', '/multiplayer/');
    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page.locator('#field-panel')).toBeHidden();
    await expect(link).toBeFocused();
  });

  test('a case card: cover, name, one line, key numbers and Read the case study (no long text); the camera keeps the base clear', async ({ page }) => {
    await enter(page);
    await page.locator('.stage [data-stop="nipotyno"]').click();
    await expect(card(page)).toHaveAttribute('data-panel', 'nipotyno');
    await expect(card(page).locator('.panel-cover')).toBeVisible();
    await expect(card(page).locator('.key-numbers li')).toHaveText(['13 interviews', '6 testers', 'SUS 78.75']);
    await expect(card(page).getByRole('link', { name: /Read the case study/ })).toHaveAttribute('href', '/nipotyno/');
    await expect(card(page).locator('p')).toHaveCount(2); // the kicker and the link: no TL;DR, no role
    const drawer = await page.locator('#field-panel').boundingBox();
    const base = await page.locator('.stage [data-stop="nipotyno"]').boundingBox();
    expect(base.x + base.width).toBeLessThanOrEqual(drawer.x); // 1st base and its label are not under the card
  });
});

test.describe('stadium @ 390×844 (phone)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('icon-only points with their names for screen readers, and the Stadium map list with the 4 points', async ({ page }) => {
    await enter(page);
    for (const base of await page.locator('.stage .base').all()) expect((await base.boundingBox()).width).toBeLessThanOrEqual(40); // only the icon is drawn
    await expect(page.locator('.stage [data-stop="levante"]')).toHaveAccessibleName(/Levante/);
    const map = page.getByRole('navigation', { name: 'Stadium map' });
    await expect(map).toBeVisible();
    await expect(map.getByRole('link')).toHaveCount(STOPS.length);
    await map.getByRole('link', { name: /Levante/ }).tap();
    await expect(card(page)).toHaveAttribute('data-panel', 'levante');
    // the card opens under the stage, and the stage stays on screen above it
    const stage = await page.locator('.stage').boundingBox();
    const sheet = await page.locator('#field-panel').boundingBox();
    expect(sheet.y).toBeGreaterThanOrEqual(stage.y + stage.height);
    await expect(page.locator('.stage')).toBeInViewport();
  });

  test('Swing! is inside the stage and covers no point', async ({ page }) => {
    await enter(page);
    await skip(page).tap();
    const swing = await page.locator('.swing-box').boundingBox();
    const stage = await page.locator('.stage').boundingBox();
    expect(swing.x >= stage.x && swing.x + swing.width <= stage.x + stage.width).toBe(true);
    for (const base of await page.locator('.stage .base').all()) expect(overlap(swing, await base.boundingBox()), await base.getAttribute('href')).toBe(false);
    await page.getByRole('button', { name: 'Swing!' }).tap();
    await expect(page.locator('.hud-base')).toHaveText('1st base · Nipotyno');
  });
});

test.describe('stadium without JavaScript', () => {
  test.use({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });

  test('a sentence links the three cases and the Story mode; every base is a plain link; the mode bar is there', async ({ page }) => {
    await page.goto('/play/');
    const sentence = page.locator('.no-game');
    await expect(sentence).toBeVisible();
    expect(await sentence.getByRole('link').evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(['/nipotyno/', '/levante/', '/sensor-lab/', '/story/']);
    await expect(page.locator('.stage [data-stop="levante"]')).toHaveAttribute('href', '/levante/');
    await expect(page.locator('.stage [data-stop="home"]')).toHaveAttribute('href', '/multiplayer/');
    await expect(page.locator('.mode-bar')).toBeVisible();
    await expect(page.locator('.hud-pause, .game-bar, #field-panel')).toHaveCount(3);
    for (const hidden of ['.hud-pause', '.game-bar', '#field-panel', 'dialog.pause']) await expect(page.locator(hidden)).toBeHidden();
    await page.locator('.stage [data-stop="home"]').click();
    await expect(page).toHaveURL(/\/multiplayer\/$/);
  });
});
