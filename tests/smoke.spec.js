import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Definition of Done checks for every page, at desktop and phone width.
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];
// Every page in every language (Fase 3): /, /es/, /it/, the modes (F4) and the cases.
const homes = ['/', '/es/', '/it/'];
const CASES = ['nipotyno', 'levante', 'sensor-lab'];
const pages = homes.flatMap((home) => [home, ...['story', 'play', 'multiplayer', ...CASES].map((slug) => `${home}${slug}/`)]);

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
        const slug = path === '/' ? 'home' : path.slice(1, -1).replaceAll('/', '-'); // es-nipotyno
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

for (const path of pages.filter((p) => CASES.some((c) => p.endsWith(`/${c}/`)))) {
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

test.describe('phone (390 px): simplified touch field on /play/', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const panel = (page) => page.locator('#field-panel [data-panel]:visible');

  test('field at 1× (480×270, sharp pixels, cropped by the stage), touch bases at least 24 px high', async ({ page }) => {
    await page.goto('/play/');
    const box = await page.locator('.field-img').boundingBox();
    expect([box.width, box.height]).toEqual([480, 270]);
    for (const base of await page.locator('.base').all()) {
      expect((await base.boundingBox()).height).toBeGreaterThanOrEqual(24);
    }
  });

  test('tapping a base opens its panel', async ({ page }) => {
    await page.goto('/play/');
    await page.locator('.base[data-stop="sensor-lab"]').tap();
    await expect(page).toHaveURL(/#sensor-lab$/);
    await expect(panel(page)).toHaveAttribute('data-panel', 'sensor-lab');
  });

  test('deep links (/play/#nipotyno etc.) open the field on that base; Read the case study opens the real page', async ({ page }) => {
    for (const slug of CASES) {
      await page.goto('/sensor-lab/');
      await page.goto(`/play/#${slug}`);
      await expect(panel(page)).toHaveAttribute('data-panel', slug);
      await expect(page.locator('.stage')).toBeInViewport();
      await panel(page).getByRole('link', { name: /Read the case study/ }).click();
      await expect(page).toHaveURL(new RegExp(`/${slug}/$`));
      await expect(page.locator('article.case h1')).toBeVisible(); // F4: no reader any more, the page itself
    }
  });
});

// 632 px = a side panel, 320 px = the smallest phones (there the field shrinks to the screen).
for (const width of [632, 320]) {
  test.describe(`narrow window (${width} px)`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('the field is shown inside the screen and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/play/');
      await expect(page.locator('#field')).toBeVisible();
      const stage = await page.locator('.stage').boundingBox();
      expect(stage.x + stage.width).toBeLessThanOrEqual(width);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    });
  });
}

test.describe('desktop (1280 px): the ballpark on /play/', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const panel = (page) => page.locator('#field-panel [data-panel]:visible');

  test('clicking a base runs there and opens its panel', async ({ page }) => {
    await page.goto('/play/');
    await page.locator('.base[data-stop="levante"]').click();
    await expect(page).toHaveURL(/#levante$/);
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
    await expect(page.locator('.base[data-stop="levante"]')).toHaveAttribute('aria-current', 'location');
    await expect(page.locator('#field-panel')).toBeFocused();
    await panel(page).getByRole('link', { name: /Read the case study/ }).click();
    await expect(page).toHaveURL(/\/levante\/$/);
  });

  test('arrow keys move between bases, Esc closes the panel, one Back press leaves the page', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/play/');
    await page.locator('.base[data-stop="home"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.base[data-stop="nipotyno"]')).toBeFocused();
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');
    await page.keyboard.press('ArrowRight');
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft'); // levante → nipotyno → home → (round the diamond) 3rd base
    await expect(panel(page)).toHaveAttribute('data-panel', 'sensor-lab');

    await page.getByRole('button', { name: 'Close' }).click(); // F5: ✕ Close (Esc opens the pause menu)
    await expect(page.locator('#field-panel')).toBeHidden();
    await expect(page.locator('.base[data-stop="sensor-lab"]')).toBeFocused();

    // the address is replaced when a base is clicked (never added to): one Back press goes to the page before
    await page.goto('/levante/');
    await page.goto('/play/#sensor-lab');
    await page.getByRole('button', { name: 'Close' }).click(); // the card opened by the deep link covers 1st base: close it
    await page.locator('.base[data-stop="nipotyno"]').click();
    await expect(page).toHaveURL(/#nipotyno$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/levante\/$/);
  });

  test('F1: three bases with a project, the dugout is scenery (no link, an old #lab opens no card)', async ({ page }) => {
    await page.goto('/play/#lab');
    await expect(page.locator('.stage .base[data-stop]')).toHaveCount(4); // home plate + 3 projects
    await expect(page.locator('[data-stop="lab"], [data-stop="housing"]')).toHaveCount(0);
    await expect(page.locator('#field-panel')).toBeHidden();
  });

  test('field art is pixel-perfect: 480×270 shown at an integer scale', async ({ page }) => {
    await page.goto('/play/');
    const box = await page.locator('.field-img').boundingBox();
    expect(box.width / 480).toBe(Math.round(box.width / 480));
    expect(box.height / 270).toBe(box.width / 480);
  });
});
