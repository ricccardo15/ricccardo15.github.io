import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Definition of Done checks for every page, at desktop and phone width.
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];
// Every page in every language (Fase 3): /, /es/, /it/ and their cases.
const homes = ['/', '/es/', '/it/'];
const pages = homes.flatMap((home) => [home, ...['nipotyno', 'levante', 'housing', 'lab'].map((slug) => `${home}${slug}/`)]);

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

for (const path of pages.filter((p) => !homes.includes(p))) {
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

test.describe('phone (390 px): simplified touch field', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const panel = (page) => page.locator('#field-panel [data-panel]:visible');

  test('name, CV, contact and Nipotyno are on the first screen; the field is there too', async ({ page }) => {
    await page.goto('/');
    for (const locator of [
      page.getByRole('heading', { level: 1, name: 'Riccardo Cirillo' }),
      page.locator('.player-card').getByRole('link', { name: 'Download CV (English, PDF)' }),
      page.locator('.player-card').getByRole('link', { name: 'CV en español (PDF)' }),
      page.locator('.hero a[href^="mailto:"]'),
      page.locator('.player-card').getByRole('link', { name: /^Start here/ }),
    ]) {
      await expect(locator).toBeInViewport();
    }
    await expect(page.locator('#field')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Enter the ballpark' })).toBeVisible();
  });

  test('field at 1× (480×270, sharp pixels, cropped by the stage), touch bases at least 24 px high', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('.field-img').boundingBox();
    expect([box.width, box.height]).toEqual([480, 270]);
    for (const base of await page.locator('.base').all()) {
      expect((await base.boundingBox()).height).toBeGreaterThanOrEqual(24);
    }
  });

  test('tapping a base opens its panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('.base[data-stop="housing"]').tap();
    await expect(page).toHaveURL(/#housing$/);
    await expect(panel(page)).toHaveAttribute('data-panel', 'housing');
  });

  test('deep links (#nipotyno etc.) open the field on that base', async ({ page }) => {
    for (const slug of ['nipotyno', 'levante', 'housing', 'lab']) {
      await page.goto('/lab/');
      await page.goto(`/#${slug}`);
      await expect(panel(page)).toHaveAttribute('data-panel', slug);
      await expect(page.locator('#field')).toBeInViewport();
      await panel(page).getByRole('link', { name: /Read the case study/ }).click();
      await expect(page).toHaveURL(new RegExp(`/${slug}/$`));
      await expect(page.locator('dialog.reader article.case h1')).toBeVisible(); // Fase 2: the case opens in the reader
    }
  });
});

// 632 px = a side panel, 320 px = the smallest phones (there the field shrinks to the screen).
for (const width of [632, 320]) {
  test.describe(`narrow window (${width} px)`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('the field is shown inside the screen and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#field')).toBeVisible();
      const stage = await page.locator('.stage').boundingBox();
      expect(stage.x + stage.width).toBeLessThanOrEqual(width);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      expect(overflow).toBe(false);
    });
  });
}

test.describe('desktop (1280 px): the ballpark', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const panel = (page) => page.locator('#field-panel [data-panel]:visible');

  test('first screen shows name, role, CV, contact and a way into Nipotyno', async ({ page }) => {
    await page.goto('/');
    for (const locator of [
      page.getByRole('heading', { level: 1, name: 'Riccardo Cirillo' }),
      page.getByText('UX Research & Design intern · Madrid · Feb–Jul 2027').first(),
      page.locator('.player-card').getByRole('link', { name: 'Download CV (English, PDF)' }),
      page.locator('.player-card').getByRole('link', { name: 'CV en español (PDF)' }),
      page.locator('.hero a[href^="mailto:"]'),
      page.locator('.player-card').getByRole('link', { name: /^Start here/ }),
      page.getByRole('link', { name: 'Enter the ballpark' }),
      page.getByRole('link', { name: 'Skip → Case studies' }),
      page.getByRole('radio', { name: 'Researcher' }),
    ]) {
      await expect(locator).toBeInViewport();
    }
  });

  test('clicking a base runs there and opens its panel', async ({ page }) => {
    await page.goto('/');
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
    await page.goto('/');
    await page.locator('.base[data-stop="home"]').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('.base[data-stop="nipotyno"]')).toBeFocused();
    await expect(panel(page)).toHaveAttribute('data-panel', 'nipotyno');
    await page.keyboard.press('ArrowRight');
    await expect(panel(page)).toHaveAttribute('data-panel', 'levante');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await expect(panel(page)).toHaveAttribute('data-panel', 'lab');

    await page.keyboard.press('Escape');
    await expect(page.locator('#field-panel')).toBeHidden();
    await expect(page.locator('.base[data-stop="lab"]')).toBeFocused();

    // the address is replaced when a base is clicked (never added to): one Back press goes to the page before
    await page.goto('/lab/');
    await page.goto('/#housing');
    await page.keyboard.press('Escape'); // the card opened by the deep link covers 1st base: close it
    await page.locator('.base[data-stop="nipotyno"]').click();
    await expect(page).toHaveURL(/#nipotyno$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/lab\/$/);
  });

  test('deep link /#lab opens the dugout panel with the runner on it', async ({ page }) => {
    await page.goto('/#lab');
    await expect(panel(page)).toHaveAttribute('data-panel', 'lab');
    await expect(page.locator('#field')).toBeInViewport();
    const runner = await page.locator('.runner').evaluate((el) => el.style.getPropertyValue('--x'));
    expect(runner).toBe(`${(110 / 480) * 100}%`); // the dugout is at x = 110
  });

  test('field art is pixel-perfect: 480×270 shown at an integer scale', async ({ page }) => {
    await page.goto('/');
    const box = await page.locator('.field-img').boundingBox();
    expect(box.width / 480).toBe(Math.round(box.width / 480));
    expect(box.height / 270).toBe(box.width / 480);
  });
});

test.describe('Start screen: uniforms', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  const card = (page) => page.locator('.uniform-card:visible');

  test('Researcher by default; Maker shows its skills and suggests Levante, and is remembered', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('radio', { name: 'Researcher' })).toBeChecked();
    await expect(card(page)).toHaveCount(1);
    await expect(card(page)).toHaveAttribute('data-uniform', 'researcher');

    await page.locator('.uniform-tiles').getByText('Maker', { exact: true }).click();
    await expect(card(page)).toHaveAttribute('data-uniform', 'maker');
    await expect(card(page)).toContainText('Arduino');
    await expect(card(page).getByRole('link')).toHaveAttribute('href', '/levante/');
    // the batter and the runner on the field wear the Maker uniform (row 2 of the sprite)
    const row = await page.locator('.runner').evaluate((el) => getComputedStyle(el).getPropertyValue('--uniform-row').trim());
    expect(row).toBe('2');

    await page.reload();
    await expect(page.getByRole('radio', { name: 'Maker' })).toBeChecked();
  });

  test('uniforms work with the keyboard and show focus', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('radio', { name: 'Researcher' }).focus();
    await page.keyboard.press('ArrowRight');
    const designer = page.getByRole('radio', { name: 'Designer' });
    await expect(designer).toBeFocused();
    await expect(designer).toBeChecked();
    await expect(card(page)).toHaveAttribute('data-uniform', 'designer');
    await expect(card(page).getByRole('link')).toHaveAttribute('href', '/nipotyno/');
    const outline = await page.locator('.uniforms label:has(input:focus-visible)').evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
  });

  test('Enter the ballpark goes to the field, Skip goes to the list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Enter the ballpark' }).click();
    await expect(page.locator('#field')).toBeInViewport();
    await page.goto('/');
    await page.getByRole('link', { name: 'Skip → Case studies' }).click();
    await expect(page.locator('#work')).toBeInViewport();
  });
});
