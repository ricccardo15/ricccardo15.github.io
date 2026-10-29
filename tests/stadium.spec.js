import { test, expect } from '@playwright/test';
import { SPOTS, STOPS } from '../src/field-map.js';

// Fase 2: the stadium is the navigation centre. Every point opens its card over the stadium (a drawer on desktop,
// under the stage on phones); ✕ Close and Esc close it and the focus goes back to the point. Without JS: plain links.
const card = (page) => page.locator('#field-panel [data-panel]:visible');
const enter = async (page) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Enter the ballpark' }).click();
};
const overlap = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);

test.describe('stadium @ 1280×800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('"Enter the ballpark" brings the stadium to the screen; it fills the screen, the card is closed, Swing! has the focus', async ({ page }) => {
    await enter(page);
    const field = await page.locator('#field').boundingBox();
    expect(Math.abs(field.y)).toBeLessThanOrEqual(20); // the page keeps 1rem of scroll padding
    expect(field.height).toBeGreaterThanOrEqual(800 - 60);
    await expect(page.locator('.stage')).toBeInViewport({ ratio: 1 });
    await expect(page.locator('#field-panel')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeFocused();
    // Swing! sits inside the stage, under home plate, and covers no label
    const stage = await page.locator('.stage').boundingBox();
    const swing = await page.locator('.swing-box').boundingBox();
    expect(swing.x >= stage.x && swing.x + swing.width <= stage.x + stage.width && swing.y + swing.height <= stage.y + stage.height).toBe(true);
    for (const base of await page.locator('.base').all()) expect(overlap(swing, await base.boundingBox()), await base.getAttribute('href')).toBe(false);
  });

  for (const spot of SPOTS) {
    test(`${spot.label} opens "${spot.name}"; Esc and ✕ Close close it and the focus goes back`, async ({ page }) => {
      await enter(page);
      const link = page.locator(`.stage [data-spot="${spot.id}"]`);
      await link.click();
      await expect(card(page)).toHaveAttribute('data-panel', spot.id);
      await expect(page.locator('#field-panel')).toBeFocused();
      await expect(page.locator('.game-bar [role="status"]')).toHaveText(`${spot.name}.`);
      await page.keyboard.press('Escape');
      await expect(page.locator('#field-panel')).toBeHidden();
      await expect(link).toBeFocused();
      await link.click();
      await page.getByRole('button', { name: 'Close' }).click();
      await expect(page.locator('#field-panel')).toBeHidden();
      await expect(link).toBeFocused();
    });
  }

  test('the cards have their content: About = player stats, How I design = principles + uniforms + moodboard, Contact = email + CVs', async ({ page }) => {
    await enter(page);
    await page.locator('.stage [data-spot="about"]').click();
    for (const text of ['Player stats', 'University of Trento', 'Universidad Politécnica de Madrid', 'University of Turin', 'Why baseball?', 'Toolbox']) await expect(card(page)).toContainText(text);
    await page.locator('.stage [data-spot="how"]').click({ force: true });
    for (const text of ['Find out first', 'Researcher', 'Designer', 'Maker', 'Moodboard']) await expect(card(page)).toContainText(text);
    await page.keyboard.press('Escape');
    await page.locator('.stage [data-spot="contact"]').click();
    await expect(card(page).getByRole('link', { name: 'CV en español (PDF)' })).toHaveAttribute('lang', 'es');
    await expect(card(page).locator('a[href^="mailto:"]')).toBeVisible();
  });

  test('a case card shows the key numbers, Read the case study and the PDF; the camera keeps the base clear of the card', async ({ page }) => {
    await enter(page);
    await page.locator('.stage [data-stop="nipotyno"]').click();
    await expect(card(page)).toHaveAttribute('data-panel', 'nipotyno');
    await expect(card(page).locator('.key-numbers li')).toHaveText(['13 interviews', '6 testers', 'SUS 78.75']);
    await expect(card(page).getByRole('link', { name: /Read the case study/ })).toHaveAttribute('href', '/nipotyno/');
    await expect(card(page).getByRole('link', { name: /PDF/ })).toHaveAttribute('href', '/pdf/Riccardo_Cirillo_Nipotyno.pdf');
    const drawer = await page.locator('#field-panel').boundingBox();
    const base = await page.locator('.stage [data-stop="nipotyno"]').boundingBox();
    expect(base.x + base.width).toBeLessThanOrEqual(drawer.x); // 1st base and its label are not under the card
  });

  test('in the tour, clicking a spot ends the tour and opens its card', async ({ page }) => {
    await enter(page);
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(page.locator('.tour-count')).toHaveText('1 of 3 · Nipotyno');
    await page.locator('.stage [data-spot="about"]').click();
    await expect(card(page)).toHaveAttribute('data-panel', 'about');
    await expect(page.locator('.game-bar [role="status"]')).toHaveText('Tour ended. Free mode. About.');
    await expect(page.locator('.tour-map')).toBeHidden();
  });
});

test.describe('stadium @ 390×844 (phone)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('icon-only points with their names for screen readers, and the Stadium map list with all 7 points', async ({ page }) => {
    await enter(page);
    for (const base of await page.locator('.stage .base').all()) expect((await base.boundingBox()).width).toBeLessThanOrEqual(40); // only the icon is drawn
    await expect(page.locator('.stage [data-stop="levante"]')).toHaveAccessibleName(/Levante/);
    const map = page.getByRole('navigation', { name: 'Stadium map' });
    await expect(map).toBeVisible();
    await expect(map.getByRole('link')).toHaveCount(STOPS.length + SPOTS.length);
    await map.getByRole('link', { name: /How I design/ }).tap();
    await expect(card(page)).toHaveAttribute('data-panel', 'how');
    // the card opens under the stage, and the stage stays on screen above it
    const stage = await page.locator('.stage').boundingBox();
    const sheet = await page.locator('#field-panel').boundingBox();
    expect(sheet.y).toBeGreaterThanOrEqual(stage.y + stage.height);
    await expect(page.locator('.stage')).toBeInViewport();
  });

  test('Swing! is inside the stage and covers no point', async ({ page }) => {
    await enter(page);
    const swing = await page.locator('.swing-box').boundingBox();
    const stage = await page.locator('.stage').boundingBox();
    expect(swing.x >= stage.x && swing.x + swing.width <= stage.x + stage.width).toBe(true);
    for (const base of await page.locator('.stage .base').all()) expect(overlap(swing, await base.boundingBox()), await base.getAttribute('href')).toBe(false);
    await page.getByRole('button', { name: 'Swing!' }).tap();
    await expect(page.locator('.tour-count')).toHaveText('1 of 3 · Nipotyno');
  });
});

test.describe('stadium without JavaScript', () => {
  test.use({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });

  test('every point is a plain link to a real place, and the home card is shown', async ({ page }) => {
    await page.goto('/');
    for (const spot of SPOTS) {
      await expect(page.locator(`.stage [data-spot="${spot.id}"]`)).toHaveAttribute('href', spot.href);
      await expect(page.locator(spot.href)).toHaveCount(1);
    }
    await expect(page.locator('.stage [data-stop="levante"]')).toHaveAttribute('href', '/levante/');
    await expect(card(page)).toHaveAttribute('data-panel', 'home');
    await expect(page.locator('.game-bar')).toBeHidden();
    await page.locator('.stage [data-spot="contact"]').click();
    await expect(page.locator('#contact')).toBeInViewport();
  });
});
