import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// F5 (v3): /play/ is the game, full page: HUD on top, the uniform as the first step, a pause menu (Esc / ⏸) that leads to the
// other modes, little text in the cards, "Game over? Never." at the end. Without JS: a sentence with plain links.
const pause = (page) => page.locator('dialog.pause');
const hudBase = (page) => page.locator('.hud-base');
const skip = (page) => page.getByRole('button', { name: /^Skip/ });

test.describe('/play/ @ 1280 px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('the game is the page: HUD in one row instead of the mode bar and the footer', async ({ page }) => {
    await page.goto('/play/');
    await expect(page.locator('.mode-bar')).toBeHidden();
    await expect(page.locator('.site-footer')).toBeHidden();
    const parts = ['.hud-pause', '.hud-title', '.hud-base', '.hud-diamonds', '.hud-sound'];
    const centres = [];
    for (const sel of parts) {
      const box = await page.locator(sel).boundingBox();
      centres.push(box.y + box.height / 2);
    }
    expect(Math.max(...centres) - Math.min(...centres)).toBeLessThanOrEqual(4); // one row
    await expect(page.locator('.hud-pause')).toHaveText(/Pause · Esc/);
    await expect(hudBase(page)).toHaveText('Home plate · At bat');
    await expect(page.locator('.hud-diamonds i')).toHaveCount(3);
    await expect(page.locator('.no-game')).toBeHidden();
  });

  test('Esc opens the pause menu (focus on Resume) and closes it (focus back); ⏸ opens it too', async ({ page }) => {
    await page.goto('/play/');
    await skip(page).click();
    const swing = page.getByRole('button', { name: 'Swing!' });
    await expect(swing).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(pause(page)).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Paused' })).toBeVisible();
    await expect(pause(page).getByRole('button', { name: 'Resume' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(pause(page)).toBeHidden();
    await expect(swing).toBeFocused();

    await page.locator('.hud-pause').click();
    await expect(pause(page)).toBeVisible();
    await pause(page).getByRole('button', { name: 'Resume' }).click();
    await expect(pause(page)).toBeHidden();
    await expect(page.locator('.hud-pause')).toBeFocused();
  });

  test('Tab stays inside the pause menu, both ways', async ({ page }) => {
    await page.goto('/play/#levante');
    await page.keyboard.press('Escape');
    await expect(pause(page)).toBeVisible();
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => document.querySelector('dialog.pause').contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await page.evaluate(() => document.querySelector('dialog.pause').contains(document.activeElement))).toBe(true);
    }
  });

  test('every item of the pause menu leads where it says', async ({ page }) => {
    await page.goto('/play/');
    await page.keyboard.press('Escape');
    // no project visited yet: nothing to "read this"
    await expect(pause(page).getByRole('link', { name: /Read this project/ })).toBeHidden();
    await page.keyboard.press('Escape');

    await page.goto('/play/#levante');
    await page.keyboard.press('Escape');
    const items = pause(page).locator('.pause-menu .pause-item');
    await expect(items).toHaveCount(5);
    await expect(pause(page).locator('.pause-name')).toHaveText(['Resume', 'Read this project', 'Switch to Story mode', 'Multiplayer', 'Title screen']);
    await expect(pause(page).getByRole('link', { name: /Read this project/ })).toHaveAttribute('href', '/levante/');
    await expect(pause(page).getByRole('link', { name: /Read this project/ })).toContainText('Levante, full case study');
    await expect(pause(page).getByRole('link', { name: /Switch to Story mode/ })).toHaveAttribute('href', '/story/');
    await expect(pause(page).getByRole('link', { name: /^Multiplayer/ })).toHaveAttribute('href', '/multiplayer/');
    await expect(pause(page).getByRole('link', { name: 'Title screen' })).toHaveAttribute('href', '/');
    await pause(page).getByRole('link', { name: /Read this project/ }).click();
    await expect(page).toHaveURL(/\/levante\/$/);

    for (const [name, url] of [[/Switch to Story mode/, /\/story\/$/], [/^Multiplayer/, /\/multiplayer\/$/], ['Title screen', /localhost:\d+\/$/]]) {
      await page.goto('/play/#nipotyno');
      await page.keyboard.press('Escape');
      await pause(page).getByRole('link', { name }).click();
      await expect(page).toHaveURL(url);
    }
  });

  test('pause menu: language keeps the base, sound and motion switch and are remembered', async ({ page }) => {
    await page.goto('/play/#levante');
    await page.keyboard.press('Escape');
    const sound = pause(page).getByRole('button', { name: /Sound/ });
    await expect(sound).toHaveAttribute('aria-pressed', 'false');
    await sound.click();
    await expect(sound).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.hud-sound')).toHaveAttribute('aria-pressed', 'true'); // the HUD agrees
    await pause(page).locator('a[hreflang="es"]').click();
    await expect(page).toHaveURL(/\/es\/play\/#levante$/);
    await expect(page.locator('#field-panel [data-panel="levante"]')).toBeVisible();
    await expect(page.locator('.hud-sound')).toHaveAttribute('aria-pressed', 'true');
  });

  test('uniform: Maker dresses the runner (row 2 of the sheet) and is remembered; Skip keeps the uniform', async ({ page }) => {
    await page.goto('/play/');
    await page.getByRole('button', { name: 'Maker' }).click();
    await expect(page.locator('.uniform-pick')).toBeHidden();
    expect(await page.locator('.runner').evaluate((el) => getComputedStyle(el).backgroundPositionY)).toBe(`${-48 * 2 * 2}px`);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Maker' })).toHaveAttribute('aria-pressed', 'true');
    await skip(page).click();
    expect(await page.locator('.runner').evaluate((el) => getComputedStyle(el).backgroundPositionY)).toBe(`${-48 * 2 * 2}px`);
  });

  test('the whole game with the keyboard: uniform, swing, Next base, arrows, the end', async ({ page }) => {
    await page.goto('/play/');
    // from the top of the page: skip link, ⏸ Pause, Sound, then the bases and the tiles; no focus jump on load
    await expect(page.locator('body')).toBeFocused();
    await page.getByRole('button', { name: 'Researcher' }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Designer' })).toBeFocused();
    await page.keyboard.press('Enter'); // Designer
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(hudBase(page)).toHaveText('1st base · Nipotyno');
    await page.keyboard.press('Enter'); // Next base: Levante (the focus is on it)
    await expect(hudBase(page)).toHaveText('2nd base · Levante');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // Finish the tour
    await expect(hudBase(page)).toHaveText('Tour complete');
    await expect(page.locator('.hud-diamonds i.is-visited')).toHaveCount(3);
    await expect(page.locator('[data-panel="done"] h2')).toHaveText('Game over? Never.');
    await page.locator('[data-panel="done"]').getByRole('button', { name: 'Play again' }).click();
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeFocused();
    // free mode: ← → between the bases
    await page.locator('.base[data-stop="levante"]').click();
    await page.locator('.base[data-stop="levante"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.base[data-stop="sensor-lab"]')).toBeFocused();
    await expect(hudBase(page)).toHaveText('3rd base · Sensor lab');
  });

  test('axe: no violations with the pause menu open', async ({ page }) => {
    await page.goto('/play/#nipotyno');
    await page.keyboard.press('Escape');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe('/play/ with motion', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('"Reduce motion" in the pause menu: no pitch, no zoom, nothing keeps moving', async ({ page }) => {
    await page.goto('/play/');
    await skip(page).click();
    await page.keyboard.press('Escape');
    const motion = pause(page).getByRole('button', { name: /Reduce motion/ });
    await expect(motion).toHaveAttribute('aria-pressed', 'false');
    await motion.click();
    await expect(motion).toHaveAttribute('aria-pressed', 'true');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(hudBase(page)).toHaveText('1st base · Nipotyno');
    await page.waitForTimeout(300);
    await expect(page.locator('.stage')).not.toHaveClass(/is-zoomed/);
    await expect(page.locator('.ball')).toBeHidden();
    expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/reduce-motion/); // remembered
  });
});

test.describe('screenshots of /play/ with and without the pause menu', () => {
  for (const { width, height } of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
    test(`@ ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/play/');
      await page.evaluate(() => document.fonts.ready);
      await page.screenshot({ path: `tests/screenshots/v3/f5-play-${width}.png` });
      await skip(page).click();
      await page.getByRole('button', { name: 'Swing!' }).click();
      await expect(hudBase(page)).toHaveText('1st base · Nipotyno');
      await page.screenshot({ path: `tests/screenshots/v3/f5-play-tour-${width}.png` });
      await page.keyboard.press('Escape');
      await expect(pause(page)).toBeVisible();
      await page.screenshot({ path: `tests/screenshots/v3/f5-play-pause-${width}.png` });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }
});
