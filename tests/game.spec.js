import { test, expect } from '@playwright/test';

// Batting → home run → tour (one project per base) → free mode. The game never blocks the content.
// The tour never moves on by itself: the visitor presses "Next base" in the card; one browser Back leaves the page.
const count = (page) => page.locator('.tour-count');
const panel = (page) => page.locator('#field-panel [data-panel]:visible');
const bar = (page, mode) => page.locator(`.game-bar [data-mode="${mode}"]`);
const nextButton = (page) => page.getByRole('button', { name: /^(Next base|Finish the tour)/ });
const backButton = (page) => panel(page).getByRole('button', { name: 'Back' });
const status = (page) => page.locator('.game-bar [role="status"]');

test.describe('game @ 1280 px, reduced motion (no pitch, no zoom)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('Swing! → home run → tour with Next base / Back to the last card → take another swing', async ({ page }) => {
    await page.goto('/');
    await expect(bar(page, 'bat')).toBeVisible();
    // "Home run!" shows for only 0.6 s with reduced motion: record that it appeared instead of racing to see it
    await page.evaluate(() => {
      const banner = document.querySelector('.banner');
      window.__banner = false;
      new MutationObserver(() => { if (!banner.hidden) window.__banner = true; }).observe(banner, { attributes: true, attributeFilter: ['hidden'] });
    });
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect.poll(() => page.evaluate(() => window.__banner)).toBe(true);

    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await expect(page).toHaveURL(/#nipotyno$/);
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');
    await expect(panel(page).locator('.panel-cover')).toBeVisible();
    // controls are inside the card: one main button with the name of the next base, no Back on the first stop
    await expect(nextButton(page)).toHaveText('Next base: Levante →');
    await expect(panel(page).locator('.tour-nav')).toHaveCount(1);
    await expect(nextButton(page)).toBeFocused();
    await expect(backButton(page)).toHaveCount(0);
    // no timer, no Pause, no old bar controls
    await expect(page.locator('.timer, [data-action="pause"], .tour-step')).toHaveCount(0);

    await nextButton(page).click();
    await expect(count(page)).toHaveText('2 of 4 · Levante');
    await expect(nextButton(page)).toBeFocused(); // keyboard users keep going with Enter
    await backButton(page).click();
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');

    for (const name of ['Levante', 'Housing', 'Lab']) {
      await nextButton(page).click();
      await expect(count(page)).toContainText(name);
      await expect(panel(page)).toHaveAttribute('data-panel', name.toLowerCase());
    }
    // last base: the main button finishes the tour
    await expect(nextButton(page)).toHaveText('Finish the tour →');
    await nextButton(page).click();
    await expect(count(page)).toHaveText('Tour complete');
    await expect(panel(page)).toHaveAttribute('data-panel', 'done');
    await expect(panel(page).getByRole('link', { name: 'CV (English, PDF)' })).toBeVisible();
    await expect(nextButton(page)).toHaveCount(0);
    await expect(backButton(page)).toBeVisible();
    await expect(page.locator('.tour-diamond i.is-visited')).toHaveCount(4);

    await panel(page).getByRole('button', { name: 'Take another swing' }).click();
    await expect(bar(page, 'bat')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Swing!' })).toBeFocused();
    await expect(panel(page)).toHaveAttribute('data-panel', 'home');
    await expect(page.locator('.tour-nav')).toHaveCount(0);
  });

  test('the diamond fills up as the bases are visited; status and counter agree', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    const visited = page.locator('.tour-diamond i.is-visited');
    await expect(visited).toHaveCount(1);
    await expect(page.locator('.tour-diamond i.is-current')).toHaveAttribute('data-corner', 'first');
    await expect(status(page)).toHaveText('Tour 1 of 4: Nipotyno.');
    await nextButton(page).click();
    await expect(visited).toHaveCount(2);
    await expect(page.locator('.tour-diamond i.is-current')).toHaveAttribute('data-corner', 'second');
    await expect(status(page)).toHaveText('Tour 2 of 4: Levante.');
    await backButton(page).click();
    await expect(visited).toHaveCount(2); // visited stays filled, the current one moves back
    await expect(page.locator('.tour-diamond i.is-current')).toHaveAttribute('data-corner', 'first');
  });

  test('Space and a click on the field also swing', async ({ page }) => {
    await page.goto('/');
    await page.locator('#field').scrollIntoViewIfNeeded();
    await page.locator('body').click({ position: { x: 5, y: 5 } }); // focus on the page, not on a control
    await page.keyboard.press('Space');
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');

    await page.goto('/');
    await page.locator('.stage').click({ position: { x: 300, y: 30 } }); // the stands: no base there
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
  });

  test('after the tour one browser Back press leaves the page (the address is replaced, not added to)', async ({ page }) => {
    await page.goto('/lab/');
    await page.goto('/');
    await page.getByRole('link', { name: 'Play ball!' }).click(); // a link to #field: must not add a history entry
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await nextButton(page).click();
    await nextButton(page).click();
    await expect(count(page)).toHaveText('3 of 4 · Housing');
    await expect(page).toHaveURL(/#housing$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/lab\/$/);
  });

  test('Back in free mode also leaves with one press', async ({ page }) => {
    await page.goto('/lab/');
    await page.goto('/');
    await page.locator('.base[data-stop="levante"]').click();
    await page.locator('.base[data-stop="housing"]').click();
    await expect(page).toHaveURL(/#housing$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/lab\/$/);
  });

  test('a link to another anchor in the middle of the tour ends it (hash that is not a base)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await page.getByRole('link', { name: 'Skip → Case studies' }).click();
    await page.goBack(); // back from #work to the base address: free mode, not the tour
    await expect(bar(page, 'free')).toBeVisible();
    await expect(bar(page, 'tour')).toBeHidden();
  });

  test('clicking a base, Esc or "Exit tour" leaves the tour; deep links skip the at-bat', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await page.locator('.base[data-stop="housing"]').click();
    await expect(bar(page, 'free')).toBeVisible();
    await expect(bar(page, 'tour')).toBeHidden();
    await expect(panel(page)).toHaveAttribute('data-panel', 'housing');
    await expect(status(page)).toHaveText('Tour ended. Free mode. Housing, 3rd base.');
    await expect(page.locator('.tour-nav')).toHaveCount(0);

    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await page.getByRole('button', { name: 'Exit tour' }).click();
    await expect(bar(page, 'free')).toBeVisible();
    await expect(status(page)).toHaveText('Tour ended. Free mode.');
    await expect(page.locator('.tour-map')).toBeHidden();

    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await page.keyboard.press('Escape');
    await expect(bar(page, 'free')).toBeVisible();
    await expect(page.locator('#field-panel')).toBeHidden();

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

  test('high five on 1st base with a zoom; base labels stay hidden until the zoom is closed; Next works during it; nothing moves on by itself', async ({ page }) => {
    test.setTimeout(75_000);
    await page.goto('/');
    // Record what `.bases` looks like at the exact moment the zoom class goes away, and 0.8 s later.
    await page.evaluate(() => {
      const stage = document.querySelector('.stage');
      const bases = document.querySelector('.bases');
      let seen = false;
      window.__zoomOut = null;
      new MutationObserver(() => {
        if (stage.classList.contains('is-zoomed')) { seen = true; return; }
        if (!seen || window.__zoomOut) return;
        window.__zoomOut = { atExit: getComputedStyle(bases).visibility };
        setTimeout(() => { window.__zoomOut.after = getComputedStyle(bases).visibility; }, 800);
      }).observe(stage, { attributes: true, attributeFilter: ['class'] });
    });

    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(page.locator('.banner')).toBeVisible({ timeout: 10_000 });
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno', { timeout: 10_000 });
    await expect(page.locator('.stage')).toHaveClass(/is-zoomed/, { timeout: 10_000 });
    await expect(page.locator('.runner')).toHaveClass(/is-highfive/);
    await expect(page.locator('[data-crew="coach1"]')).toHaveClass(/is-highfive/);
    await page.screenshot({ path: 'tests/screenshots/tour-highfive-1280.png' });

    // 0.1: while the world scales back (0.5 s) the labels are still hidden; afterwards they are visible
    await page.waitForFunction(() => window.__zoomOut?.after, null, { timeout: 8_000 });
    const zoomOut = await page.evaluate(() => window.__zoomOut);
    expect(zoomOut).toEqual({ atExit: 'hidden', after: 'visible' });

    // no change of base without a click: wait 15 s on the card
    await page.waitForTimeout(15_000);
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');

    // Next works while a moment is playing: go on and click again during the zoom of the next stop
    await nextButton(page).click();
    await expect(count(page)).toHaveText('2 of 4 · Levante');
    await expect(page.locator('.stage')).toHaveClass(/is-zoomed/, { timeout: 5_000 });
    await nextButton(page).click(); // the zoom is still on
    await expect(count(page)).toHaveText('3 of 4 · Housing', { timeout: 10_000 });
  });
});

test.describe('game @ 390 px (touch)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('tap Swing! → tour on the phone: the card has its own Next, no sideways scroll', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.getByRole('button', { name: 'Swing!' }).tap();
    await expect(count(page)).toHaveText('1 of 4 · Nipotyno');
    await nextButton(page).tap();
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
    // the diamond fits inside the small field
    const map = await page.locator('.tour-map').boundingBox();
    const stage = await page.locator('.stage').boundingBox();
    expect(map.x + map.width).toBeLessThanOrEqual(stage.x + stage.width);
  });
});
