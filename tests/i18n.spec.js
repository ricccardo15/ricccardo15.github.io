import { test, expect } from '@playwright/test';

// Fase 3: English on /, Spanish on /es/, Italian on /it/. Real static pages in each language, a switcher that keeps
// the same page, the right CV, a remembered choice that only "/" follows, and a game with no English left in it.
const SITE = 'https://ricccardo15.github.io';
const LANGS = { en: '', es: '/es', it: '/it' };

test.describe('languages @ 1280 px', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  for (const [lang, prefix] of Object.entries(LANGS)) {
    for (const key of ['/', '/levante/']) {
      const path = `${prefix}${key}`;
      test(`${path}: lang, hreflang, og:locale, canonical and the switcher`, async ({ page }) => {
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('lang', lang);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `${SITE}${path}`);
        for (const [other, otherPrefix] of Object.entries(LANGS)) {
          await expect(page.locator(`link[rel="alternate"][hreflang="${other}"]`)).toHaveAttribute('href', `${SITE}${otherPrefix}${key}`);
        }
        await expect(page.locator('link[rel="alternate"][hreflang="x-default"]')).toHaveAttribute('href', `${SITE}${key}`);
        await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', { en: 'en_GB', es: 'es_ES', it: 'it_IT' }[lang]);

        // the switcher: three text links to this same page, the current one marked
        const items = page.locator('.lang-switch a');
        await expect(items).toHaveText(['EN English', 'ES Español', 'IT Italiano']);
        for (const [other, otherPrefix] of Object.entries(LANGS)) {
          const link = page.locator(`.lang-switch a[hreflang="${other}"]`);
          await expect(link).toHaveAttribute('href', `${otherPrefix}${key}`);
          await expect(link).toHaveAttribute('lang', other);
          if (other === lang) await expect(link).toHaveAttribute('aria-current', 'page');
          else await expect(link).not.toHaveAttribute('aria-current');
        }

        // the CV in the header follows the language: EN for EN and IT, ES for ES
        const cv = page.locator('.site-header nav a[href^="/cv/"]');
        await expect(cv).toHaveCount(1);
        await expect(cv).toHaveAttribute('href', lang === 'es' ? '/cv/CV_Riccardo_Cirillo_ES.pdf' : '/cv/CV_Riccardo_Cirillo_EN.pdf');
        // every CV link in another language than the page says so (WCAG 3.1.2)
        for (const link of await page.locator('a[href^="/cv/"]').all()) {
          const cvLang = (await link.getAttribute('href')).includes('_ES') ? 'es' : 'en';
          if (cvLang !== lang) await expect(link).toHaveAttribute('lang', cvLang);
        }
      });
    }
  }

  test('the switcher keeps the page and the base, and is reachable with the keyboard', async ({ page }) => {
    await page.goto('/es/levante/');
    await expect(page.locator('h1')).toContainText('Levante');
    await page.locator('.lang-switch a[hreflang="it"]').click();
    await expect(page).toHaveURL(/\/it\/levante\/$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'it');
    await expect(page.locator('.facts dt').first()).toHaveText('Il mio ruolo');

    // on the home the base in the address goes along
    await page.goto('/#sensor-lab');
    await page.locator('.lang-switch a[hreflang="es"]').focus();
    await expect(page.locator('.lang-switch a[hreflang="es"]')).toBeFocused();
    const outline = await page.locator('.lang-switch a[hreflang="es"]').evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe('none');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/es\/#sensor-lab$/);
    await expect(page.locator('#field-panel [data-panel="sensor-lab"]')).toBeVisible();
  });

  test('"/" follows a language only after the visitor chose it; choosing EN again stops it', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/); // never guessed from the browser
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('.lang-switch a[hreflang="es"]').click();
    await expect(page).toHaveURL(/\/es\/$/);

    await page.goto('/#levante');
    await expect(page).toHaveURL(/\/es\/#levante$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');

    await page.locator('.lang-switch a[hreflang="en"]').click();
    await expect(page).toHaveURL(/\/#levante$/);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    // case pages never redirect
    await page.locator('.lang-switch a[hreflang="it"]').click();
    await page.goto('/nipotyno/');
    await expect(page).toHaveURL(/\/nipotyno\/$/);
  });

  for (const [lang, words] of Object.entries({
    es: { next: 'Siguiente base: Levante →', count: '1 de 3 · Nipotyno', swing: '¡Batea!', back: 'Volver al estadio', read: 'Lee el caso de estudio' },
    it: { next: 'Prossima base: Levante →', count: '1 di 3 · Nipotyno', swing: 'Batti!', back: 'Torna allo stadio', read: 'Leggi il caso studio' },
  })) {
    test(`/${lang}/: the game and the reader speak ${lang}, no English left in the interface`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/${lang}/`);
      // English interface strings must not appear anywhere (also in hidden cards).
      // The CV links are written in the CV's own language on purpose ("CV (English, PDF)").
      const text = await page.locator('body').textContent();
      for (const english of ['Read the case study', 'Enter the ballpark', 'Take another swing', 'Explore the ballpark', 'Stadium map',
        'Select your player', 'Suggested first base', 'Back to the ballpark', 'Player stats', 'Why baseball?', 'Exit tour', 'Skip to content']) {
        expect(text, english).not.toContain(english);
      }

      await page.getByRole('button', { name: words.swing }).click();
      await expect(page.locator('.tour-count')).toHaveText(words.count);
      await expect(page).toHaveURL(new RegExp(`/${lang}/#nipotyno$`));
      const next = page.locator('#field-panel .tour-nav .button');
      await expect(next).toHaveText(words.next);
      await next.click();
      await expect(page.locator('#field-panel [data-panel="levante"]')).toBeVisible();

      // the reader opens the case in this language and closes back to this home
      const card = page.locator('#field-panel [data-panel="levante"]');
      await card.getByRole('link', { name: new RegExp(`^${words.read}`) }).click();
      const reader = page.locator('dialog.reader');
      await expect(reader).toBeVisible();
      await expect(page).toHaveURL(new RegExp(`/${lang}/levante/$`));
      await expect(reader.locator('.reader-close')).toHaveText(`✕ ${words.back}`);
      // next case inside the reader stays in the language
      await reader.locator('.pager a[rel="next"]').click();
      await expect(page).toHaveURL(new RegExp(`/${lang}/sensor-lab/$`));
      await expect(reader).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(reader).toBeHidden();
      await expect(page).toHaveURL(new RegExp(`/${lang}/#levante$`));
    });
  }

  test('translated pages: ids without accents, fixed ids the code needs, PDF in the language', async ({ page, request }) => {
    await page.goto('/es/nipotyno/');
    await expect(page.locator('section#investigacion')).toHaveCount(1); // "Investigación", not investigaci-n
    await expect(page.locator('section#tl-dr.tldr')).toHaveCount(1);
    const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id));
    for (const id of ids) expect(id).toMatch(/^[A-Za-z0-9_-]+$/);

    const pdf = page.locator('.crumb a[href^="/pdf/"]');
    await expect(pdf).toHaveAttribute('href', '/pdf/Riccardo_Cirillo_Nipotyno_ES.pdf');
    for (const file of ['Riccardo_Cirillo_Nipotyno_ES.pdf', 'Riccardo_Cirillo_Sensor_lab_IT.pdf', 'Riccardo_Cirillo_Sensor_lab.pdf']) {
      const res = await request.get(`/pdf/${file}`);
      expect(res.status(), file).toBe(200);
    }

    // the lobby, the About and How I design come from the translated About (fixed ids), in Italian
    await page.goto('/it/');
    await expect(page.locator('.card-bio')).toContainText('master EIT Digital');
    await expect(page.locator('#about')).toContainText('Perché il baseball?');
    await expect(page.locator('#how ol li')).toHaveCount(3);
    await expect(page.locator('.player-card .status-line')).toHaveText(
      'Cittadino UE · NIE spagnolo · Italiano (madrelingua) · Inglese B2 · Spagnolo B2 · Tirocinio curricolare + tesi magistrale',
    );
  });
});

// "Swing!" is longer in Spanish ("¡Batea!") and so are the labels: it must still cover no point, on desktop and on a phone.
const overlap = (a, b) => !(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
for (const { width, height } of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test.describe(`Swing! @ ${width} px`, () => {
    test.use({ viewport: { width, height } });
    for (const home of ['/es/', '/it/']) {
      test(`${home}: Swing! covers no point`, async ({ page }) => {
        await page.goto(home);
        const swing = await page.locator('.swing-box').boundingBox();
        for (const base of await page.locator('.stage .base').all()) expect(overlap(swing, await base.boundingBox()), await base.getAttribute('href')).toBe(false);
      });
    }
  });
}

test.describe('languages @ 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });
  for (const path of ['/', '/es/', '/it/nipotyno/']) {
    test(`${path}: the header with the switcher does not widen the page`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('.lang-switch')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  }
});
