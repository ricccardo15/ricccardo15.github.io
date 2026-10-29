import { test, expect } from '@playwright/test';

// Fase 0 (verbale 21/10): accessibility fixes, status line, About in the menu, covers, case pages.
const STATUS = "EU citizen · Spanish NIE · Italian (native) · English B2 · Spanish B2 · Curricular internship + master's thesis";
const cases = { nipotyno: '1st base', levante: '2nd base', 'sensor-lab': '3rd base' };

test.describe('0.3 accessibility', () => {
  for (const path of ['/', '/nipotyno/', '/multiplayer/']) {
    test(`${path}: every link to the Spanish CV says lang="es"`, async ({ page }) => {
      await page.goto(path);
      const links = page.locator('a[href$="CV_Riccardo_Cirillo_ES.pdf"]');
      // Fase 3: the bar on top shows only the CV of the page's language; the Spanish one is in the footer (and the ticket).
      expect(await links.count()).toBeGreaterThanOrEqual(path === '/multiplayer/' ? 2 : 1);
      for (const link of await links.all()) await expect(link).toHaveAttribute('lang', 'es');
    });
  }

  test('one single live region (the status in the game bar): the card panel announces nothing twice', async ({ page }) => {
    await page.goto('/play/');
    await expect(page.locator('[aria-live]')).toHaveCount(0);
    await expect(page.locator('[role="status"]')).toHaveCount(1);
    await expect(page.locator('#field-panel')).not.toHaveAttribute('aria-live', /.*/);
  });

  test('free mode announces the base once the runner arrives', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/play/');
    await page.locator('.base[data-stop="levante"]').click();
    await expect(page.locator('.game-bar [role="status"]')).toHaveText('Levante, 2nd base.');
  });
});

test.describe('0.6 status line (F4: in the scouting report of Multiplayer)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the pieces of the line are in the scouting report, from content/facts.md; no LinkedIn link yet', async ({ page }) => {
    await page.goto('/multiplayer/');
    const report = page.locator('.scouting');
    for (const piece of STATUS.split(' · ')) await expect(report).toContainText(piece);
    await expect(page.locator('a[href*="linkedin"]')).toHaveCount(0);
  });

  test('the report fits on a phone without sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/multiplayer/');
    await expect(page.locator('.scouting')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});

test.describe('0.5 covers', () => {
  test('Sensor lab uses its placeholder cover, and the image loads', async ({ page, request }) => {
    await page.goto('/play/');
    await expect(page.locator('[data-panel="sensor-lab"] img')).toHaveAttribute('src', '/assets/sensor-lab/cover.webp');
    expect((await request.get('/assets/sensor-lab/cover.webp')).status()).toBe(200);
  });
});

test.describe('0.7 case pages', () => {
  for (const slug of Object.keys(cases)) {
    test(`/${slug}/: F4, the mode bar leads back to the title screen and to the game; the bottom leads back too`, async ({ page }) => {
      await page.goto(`/${slug}/`);
      await expect(page.locator('.mode-bar .to-title')).toHaveAttribute('href', '/');
      await expect(page.locator('.mode-bar').getByRole('link', { name: 'Gameplay' })).toHaveAttribute('href', '/play/');
      await expect(page.locator('.mode-bar').getByRole('link', { name: 'Story mode' })).toHaveAttribute('aria-current', 'true');
      await expect(page.locator('.to-title-link')).toHaveAttribute('href', '/');
    });
  }

  for (const [width, height] of [[1280, 800], [390, 844]]) {
    test(`/nipotyno/ @ ${width}: no image is taller than 70% of the window, and the page does not jump when images load`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/nipotyno/');
      const before = await page.evaluate(() => document.documentElement.scrollHeight);
      const result = await page.evaluate(async () => {
        const imgs = [...document.querySelectorAll('.case figure img')];
        imgs.forEach((i) => { i.loading = 'eager'; });
        await Promise.all(imgs.map((i) => i.decode().catch(() => {})));
        await new Promise((resolve) => setTimeout(resolve, 200));
        return {
          count: imgs.length,
          after: document.documentElement.scrollHeight,
          tallest: Math.max(...imgs.map((i) => i.getBoundingClientRect().height)),
          widest: Math.max(...imgs.map((i) => i.getBoundingClientRect().width)),
          column: document.querySelector('.case').getBoundingClientRect().width,
        };
      });
      expect(result.count).toBeGreaterThanOrEqual(6);
      expect(result.tallest).toBeLessThanOrEqual(height * 0.7 + 1);
      expect(result.widest).toBeLessThanOrEqual(result.column + 1);
      expect(Math.abs(result.after - before)).toBeLessThanOrEqual(2); // same layout before and after the load
    });
  }
});
