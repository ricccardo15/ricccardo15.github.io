import { test, expect } from '@playwright/test';

// Fase 0 (verbale 21/10): accessibility fixes, status line, About in the menu, covers, case pages.
const STATUS = "EU citizen · Spanish NIE · Italian (native) · English B2 · Spanish B2 · Curricular internship + master's thesis";
const cases = { nipotyno: '1st base', levante: '2nd base', 'sensor-lab': '3rd base' };

test.describe('0.3 accessibility', () => {
  for (const path of ['/', '/nipotyno/']) {
    test(`${path}: every link to the Spanish CV says lang="es"`, async ({ page }) => {
      await page.goto(path);
      const links = page.locator('a[href$="CV_Riccardo_Cirillo_ES.pdf"]');
      // Fase 3: the header shows only the CV of the page's language, so a case page has the Spanish CV in the footer only.
      expect(await links.count()).toBeGreaterThanOrEqual(path === '/' ? 2 : 1);
      for (const link of await links.all()) await expect(link).toHaveAttribute('lang', 'es');
    });
  }

  test('one single live region (the status in the game bar): the card panel announces nothing twice', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[aria-live]')).toHaveCount(0);
    await expect(page.locator('[role="status"]')).toHaveCount(1);
    await expect(page.locator('#field-panel')).not.toHaveAttribute('aria-live', /.*/);
  });

  test('free mode announces the base once the runner arrives', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.base[data-stop="levante"]').click();
    await expect(page.locator('.game-bar [role="status"]')).toHaveText('Levante, 2nd base.');
  });
});

test.describe('0.6 status line and About in the menu', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('the line is in the hero (first screen) and in the About; the menu has About', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.hero .status-line')).toHaveText(STATUS);
    await expect(page.locator('.hero .status-line')).toBeInViewport();
    await expect(page.locator('#about .status-line')).toHaveText(STATUS);
    const about = page.locator('.site-header').getByRole('link', { name: 'About' });
    await expect(about).toHaveAttribute('href', '/#about');
    await about.click();
    await expect(page.locator('#about')).toBeInViewport();
  });

  test('About is in the menu of the case pages too, and no LinkedIn link yet', async ({ page }) => {
    await page.goto('/sensor-lab/');
    await expect(page.locator('.site-header').getByRole('link', { name: 'About' })).toHaveAttribute('href', '/#about');
    await expect(page.locator('a[href*="linkedin"]')).toHaveCount(0);
  });

  test('the line fits on a phone without sideways scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await expect(page.locator('.hero .status-line')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
  });
});

test.describe('0.5 covers', () => {
  test('Sensor lab uses its placeholder cover, and the image loads', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('#sensor-lab img')).toHaveAttribute('src', '/assets/sensor-lab/cover.webp');
    expect((await request.get('/assets/sensor-lab/cover.webp')).status()).toBe(200);
  });
});

test.describe('0.7 case pages', () => {
  for (const [slug, label] of Object.entries(cases)) {
    test(`/${slug}/: the link goes back to the ballpark (${label}), another one to the list`, async ({ page }) => {
      await page.goto(`/${slug}/`);
      const crumb = page.locator('.crumb');
      // Fase 2: the way back is in the pixel band on top of the page
      await expect(page.locator('.case-band').getByRole('link', { name: `Back to the ballpark · ${label}` })).toHaveAttribute('href', `/#${slug}`);
      await expect(crumb.getByRole('link', { name: 'All case studies' })).toHaveAttribute('href', '/#work');
      await expect(crumb).not.toContainText('← All case studies');
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
