import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Definition of Done checks for every page, at desktop and phone width.
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];
const pages = ['/'];

for (const vp of viewports) {
  for (const path of pages) {
    test.describe(`${path} @ ${vp.width}px`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('loads with no console errors and no horizontal scroll', async ({ page }) => {
        const errors = [];
        page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
        page.on('pageerror', (err) => errors.push(err.message));

        await page.goto(path);
        await expect(page.locator('h1')).toBeVisible();
        expect(errors).toEqual([]);

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        expect(overflow).toBe(false);

        const slug = path === '/' ? 'home' : path.replaceAll('/', '');
        await page.screenshot({ path: `tests/screenshots/${slug}-${vp.width}.png`, fullPage: true });
      });

      test('has no axe accessibility violations', async ({ page }) => {
        await page.goto(path);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
        expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });

      test('keyboard: Tab reaches a link with a visible focus outline', async ({ page }) => {
        await page.goto(path);
        await page.keyboard.press('Tab');
        const focused = page.locator(':focus');
        await expect(focused).toHaveJSProperty('tagName', 'A');
        const outline = await focused.evaluate((el) => getComputedStyle(el).outlineStyle);
        expect(outline).not.toBe('none');
      });

      test('works with prefers-reduced-motion', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);
        await expect(page.locator('h1')).toBeVisible();
      });
    });
  }
}

test('CV files are served', async ({ request }) => {
  for (const file of ['CV_Riccardo_Cirillo_EN.pdf', 'CV_Riccardo_Cirillo_ES.pdf']) {
    const res = await request.get(`/cv/${file}`);
    expect(res.status(), file).toBe(200);
    expect(res.headers()['content-type']).toContain('pdf');
  }
});
