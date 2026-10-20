import { test, expect } from '@playwright/test';

// B6: batting → home run → tour (one project per base) → free mode. The game never blocks the content.
const step = (page) => page.locator('.tour-step');
const panel = (page) => page.locator('#field-panel [data-panel]:visible');
const bar = (page, mode) => page.locator(`.game-bar [data-mode="${mode}"]`);

test.describe('game @ 1280 px, reduced motion (no pitch, no zoom, no timer)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('Swing! → home run → tour with Back / Next to the last card → take another swing', async ({ page }) => {
    await page.goto('/');
    await expect(bar(page, 'bat')).toBeVisible();
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(page.locator('.banner')).toBeVisible();

    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');
    await expect(page).toHaveURL(/#nipotyno$/);
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');
    await expect(panel(page).locator('.panel-cover')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeFocused();
    // reduced motion: the tour waits for Next
    await expect(page.locator('.game-bar [data-action="pause"]')).toBeHidden();
    await expect(page.locator('.timer')).toBeHidden();

    await page.getByRole('button', { name: 'Next' }).click();
    await expect(step(page)).toHaveText('2 / 5 · Levante');
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');
    await expect(page.getByRole('button', { name: 'Back' })).toBeDisabled();

    for (const name of ['Levante', 'Housing', 'Lab']) {
      await page.getByRole('button', { name: 'Next' }).click();
      await expect(step(page)).toContainText(name);
      await expect(panel(page)).toHaveAttribute('data-panel', name.toLowerCase());
    }
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(step(page)).toHaveText("5 / 5 · That's the tour");
    await expect(panel(page)).toHaveAttribute('data-panel', 'done');
    await expect(panel(page).getByRole('link', { name: 'CV (English, PDF)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();

    await panel(page).getByRole('button', { name: 'Take another swing' }).click();
    await expect(bar(page, 'bat')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeFocused();
    await expect(panel(page)).toHaveAttribute('data-panel', 'home');
  });

  test('Space and a click on the field also swing', async ({ page }) => {
    await page.goto('/');
    await page.locator('#field').scrollIntoViewIfNeeded();
    await page.locator('body').click({ position: { x: 5, y: 5 } }); // focus on the page, not on a control
    await page.keyboard.press('Space');
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');

    await page.goto('/');
    await page.locator('.stage').click({ position: { x: 300, y: 30 } }); // the stands: no base there
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');
  });

  test('the browser Back button walks back through the tour', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');
    await page.getByRole('button', { name: 'Next' }).click();
    await expect(step(page)).toHaveText('2 / 5 · Levante');
    await page.goBack();
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');
  });

  test('clicking a base or "Explore freely" leaves the tour; deep links skip the at-bat', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');
    await page.locator('.base[data-stop="housing"]').click();
    await expect(bar(page, 'free')).toBeVisible();
    await expect(bar(page, 'tour')).toBeHidden();
    await expect(panel(page)).toHaveAttribute('data-panel', 'housing');

    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await page.getByRole('button', { name: 'Explore freely' }).click();
    await expect(bar(page, 'free')).toBeVisible();

    await page.goto('/#levante');
    await expect(bar(page, 'free')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeHidden();
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
  });

  test('"Play ball!" jumps to the field with the focus on Swing!', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Play ball!' }).click();
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeFocused();
    await expect(page.locator('.stage')).toBeInViewport();
  });
});

test.describe('game @ 1280 px with motion', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the pitch is hit, then a high five on 1st base with a zoom; the timer pauses', async ({ page }) => {
    test.setTimeout(45_000);
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(page.locator('.banner')).toBeVisible({ timeout: 10_000 });
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno', { timeout: 10_000 });

    await expect(page.locator('.stage')).toHaveClass(/is-zoomed/, { timeout: 10_000 });
    await expect(page.locator('.runner')).toHaveClass(/is-highfive/);
    await expect(page.locator('[data-crew="coach1"]')).toHaveClass(/is-highfive/);
    await page.screenshot({ path: 'tests/screenshots/tour-highfive-1280.png' });
    await expect(page.locator('.stage')).not.toHaveClass(/is-zoomed/, { timeout: 5_000 });

    // the timer fills up…
    const done = () => page.locator('.timer').evaluate((el) => Number(el.style.getPropertyValue('--done')));
    await expect.poll(done).toBeGreaterThan(0);
    // …and stops on Pause
    await page.locator('.game-bar [data-action="pause"]').click();
    await expect(page.getByRole('button', { name: 'Resume the tour' })).toBeVisible();
    const paused = await done();
    await page.waitForTimeout(600);
    expect(await done()).toBe(paused);
    // focus inside the panel also holds it, after Play
    await page.getByRole('button', { name: 'Resume the tour' }).click();
    await panel(page).getByRole('link', { name: /Read the case study/ }).focus();
    const held = await done();
    await page.waitForTimeout(600);
    expect(await done()).toBe(held);
  });
});

test.describe('game @ 390 px (touch)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('tap Swing! → tour on the phone, no sideways scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).tap();
    await expect(step(page)).toHaveText('1 / 5 · Nipotyno');
    await page.getByRole('button', { name: 'Next' }).tap();
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
