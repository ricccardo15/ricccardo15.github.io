import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Definition of Done checks for every page, at desktop and phone width.
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];
const pages = ['/', '/nipotyno/', '/levante/', '/housing/', '/lab/'];

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

        // Load lazy images too, so the full-page screenshot shows them.
        await page.evaluate(() => Promise.all([...document.images].map((img) => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
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

for (const path of pages.filter((p) => p !== '/')) {
  test(`${path} has Open Graph tags and every image loads`, async ({ page, request }) => {
    await page.goto(path);
    for (const prop of ['og:title', 'og:description', 'og:url', 'og:image']) {
      await expect(page.locator(`meta[property="${prop}"]`), prop).toHaveAttribute('content', /.+/);
    }
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://ricccardo15.github.io${path}`);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect((await request.get(new URL(og).pathname)).status(), og).toBe(200);

    const images = await page.locator('main img').evaluateAll((imgs) => imgs.map((i) => ({ src: i.getAttribute('src'), alt: i.alt })));
    expect(images.length).toBeGreaterThan(0);
    for (const img of images) {
      expect(img.alt, img.src).not.toBe('');
      expect((await request.get(img.src)).status(), img.src).toBe(200);
    }
  });
}

test('home lists every case with a deep link (#nipotyno etc.)', async ({ page }) => {
  for (const slug of ['nipotyno', 'levante', 'housing', 'lab']) {
    await page.goto(`/#${slug}`);
    const card = page.locator(`#${slug}`);
    await expect(card).toBeInViewport();
    await card.getByRole('link').click();
    await expect(page).toHaveURL(new RegExp(`/${slug}/$`));
    await expect(page.locator('h1')).toBeVisible();
  }
});

test('first screen of the home shows name, role, CV, contact and the Nipotyno card', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  for (const locator of [
    page.getByRole('heading', { level: 1, name: 'Riccardo Cirillo' }),
    page.getByText('UX Research & Design intern · Madrid · Feb–Jul 2027').first(),
    page.getByRole('link', { name: 'Download CV (English, PDF)' }),
    page.getByRole('link', { name: 'CV en español (PDF)' }),
    page.locator('main a[href^="mailto:"]'),
    page.locator('#nipotyno'),
  ]) {
    await expect(locator).toBeInViewport();
  }
});
