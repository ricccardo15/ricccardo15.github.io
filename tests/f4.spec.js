import { test, expect } from '@playwright/test';

// F4 (v3): `/` is a title screen; Story mode, Gameplay and Multiplayer are whole pages, with the same mode bar on top.
// Name, role, dates, CV, email and the three projects are on the title screen; nothing is behind a gate.
const CASES = ['nipotyno', 'levante', 'sensor-lab'];

for (const { width, height } of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test.describe(`title screen @ ${width} px`, () => {
    test.use({ viewport: { width, height } });

    test('shows name, role, dates, CV, email and the 3 projects', async ({ page }) => {
      await page.goto('/');
      const name = page.getByRole('heading', { level: 1, name: 'Riccardo Cirillo' });
      const role = page.locator('.role');
      const cv = page.locator('.title-bar a[href="/cv/CV_Riccardo_Cirillo_EN.pdf"]');
      await expect(role).toContainText('UX Research & Design');
      await expect(role).toContainText('Madrid, Feb–Jul 2027');
      await expect(page.locator('footer a[href="mailto:riccardo.cirillo.work@gmail.com"]')).toBeVisible();
      await expect(page.locator('.picks > li')).toHaveCount(3);
      for (const slug of CASES) await expect(page.locator(`.picks a[href="/${slug}/"]`)).toBeVisible();
      if (width === 1280) {
        // first screen: everything a recruiter needs, and the three cards
        for (const el of [name, role, cv, page.locator('.title-menu'), ...CASES.map((s) => page.locator(`.picks a[href="/${s}/"]`))]) await expect(el).toBeInViewport();
      } else {
        // phone: name, role, dates and CV on the first screen; the Nipotyno card within two screens
        for (const el of [name, role, cv]) await expect(el).toBeInViewport();
        const nipotyno = await page.locator('.picks a[href="/nipotyno/"]').boundingBox();
        expect(nipotyno.y + nipotyno.height).toBeLessThanOrEqual(height * 2);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    });
  });
}

test.describe('title screen menu', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('three real links to the three modes, in every language', async ({ page }) => {
    for (const prefix of ['', '/es', '/it']) {
      await page.goto(`${prefix}/`);
      expect(await page.locator('.title-menu a').evaluateAll((as) => as.map((a) => a.getAttribute('href'))))
        .toEqual([`${prefix}/story/`, `${prefix}/play/`, `${prefix}/multiplayer/`]);
    }
    await page.goto('/');
    await expect(page.getByRole('link', { name: /^Story mode/ })).toContainText('Read the 3 case studies, one after the other · 5 min');
    await expect(page.getByRole('link', { name: /^Multiplayer/ })).toContainText('Contact & CV');
    await expect(page.locator('.title-bar').getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/multiplayer/');
  });

  test('keyboard: ↑ ↓ move inside the menu (and wrap), Enter opens the mode; the ▶ cursor follows the focus', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.menu-hint')).toBeVisible();
    const items = page.locator('.title-menu a');
    await items.nth(0).focus();
    await page.keyboard.press('ArrowDown');
    await expect(items.nth(1)).toBeFocused();
    const cursor = await items.nth(1).evaluate((el) => getComputedStyle(el, '::before').content);
    expect(cursor).toContain('▶');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');
    await expect(items.nth(2)).toBeFocused(); // from the first one ↑ goes round to the last
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/multiplayer\/$/);
  });

  test('the arrows do nothing outside the menu (no global keys)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.picks a').first().focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.title-menu a:focus')).toHaveCount(0);
  });

  test('reduced motion: nothing moves on the title screen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)).toBe(0);
  });
});

test.describe('the mode bar', () => {
  // /play/ has the bar without JS only: with JS the game's HUD and pause menu take its place (F5, tests/f5.spec.js)
  for (const [path, current] of [['/story/', 'Story mode'], ['/nipotyno/', 'Story mode'], ['/multiplayer/', 'Multiplayer']]) {
    test(`${path}: ◀ Title screen, the three modes (${current} lit), languages and CV`, async ({ page }) => {
      await page.goto(path);
      const bar = page.locator('.mode-bar');
      await expect(bar.getByRole('link', { name: 'Title screen' })).toHaveAttribute('href', '/');
      await expect(bar.locator('.modes a')).toHaveText(['Story mode', 'Gameplay', 'Multiplayer']);
      await expect(bar.locator('.modes a[aria-current]')).toHaveText(current);
      await expect(bar.locator('.lang-switch a')).toHaveCount(3);
      await expect(bar.locator('a.cv-top')).toHaveCount(1);
    });
  }

  test('on a phone every target of the bar is at least 44 px high and nothing scrolls sideways', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/story/', '/es/levante/', '/it/multiplayer/']) {
      await page.goto(path);
      for (const link of await page.locator('.mode-bar a').all()) expect((await link.boundingBox()).height, path).toBeGreaterThanOrEqual(44);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    }
  });
});

test.describe('Story mode', () => {
  test('chapter 0 → 1 → 2 → 3 → the end, with "Chapter N of 3" on the way', async ({ page }) => {
    await page.goto('/story/');
    await expect(page.locator('h1')).toHaveText("Hi, I'm Riccardo");
    await expect(page.locator('.motto')).toContainText("I don't know what you need");
    await expect(page.locator('.story-how ol li')).toHaveCount(3);
    for (const [i, slug] of CASES.entries()) {
      await page.locator('.next-chapter').click();
      await expect(page).toHaveURL(new RegExp(`/${slug}/$`));
      await expect(page.locator('.chapter-progress')).toContainText(`Chapter ${i + 1} of 3`);
      await expect(page.locator('.bars i.is-done')).toHaveCount(i + 1);
      await expect(page.locator('.to-title-link')).toHaveAttribute('href', '/');
    }
    const end = page.locator('.story-end');
    await expect(end.getByRole('heading')).toHaveText("That's the story");
    await expect(end.getByRole('link', { name: /Multiplayer/ })).toHaveAttribute('href', '/multiplayer/');
    await expect(end.getByRole('link', { name: 'Play the game' })).toHaveAttribute('href', '/play/');
  });

  test('a chapter has the player card (with the PDF) and the key numbers', async ({ page }) => {
    await page.goto('/nipotyno/');
    await expect(page.locator('.scorecard')).toContainText('UX researcher & designer');
    await expect(page.locator('.scorecard a[href="/pdf/Riccardo_Cirillo_Nipotyno.pdf"]')).toBeVisible();
    await expect(page.locator('.score-strip strong')).toHaveText(['13', '6', '78.75']);
    await expect(page.locator('.next-chapter')).toContainText('Levante');
  });
});

test.describe('Multiplayer', () => {
  test('ticket with the email and both CVs; scouting report from facts.md; no LinkedIn yet', async ({ page }) => {
    await page.goto('/multiplayer/');
    await expect(page.locator('h1')).toHaveText('Multiplayer');
    await expect(page.locator('.mp-sub')).toHaveText('Contact & CV. Looking for a teammate for February–July 2027?');
    await expect(page.locator('.ticket a[href="mailto:riccardo.cirillo.work@gmail.com"]')).toHaveText('riccardo.cirillo.work@gmail.com');
    await expect(page.locator('.ticket a[href$="_EN.pdf"]')).toBeVisible();
    await expect(page.locator('.ticket a[href$="_ES.pdf"]')).toHaveAttribute('lang', 'es');
    await expect(page.locator('.scout-rows dt')).toHaveText(['Position', 'Available', 'Status', 'Languages', 'Education']);
    await expect(page.locator('.scout-rows')).toContainText('University of Trento');
    await expect(page.locator('a[href*="linkedin"]')).toHaveCount(0);
  });
});

test.describe('old links of the v2 home', () => {
  for (const [from, to] of [['/#nipotyno', '/nipotyno/'], ['/#levante', '/levante/'], ['/#sensor-lab', '/sensor-lab/'], ['/#about', '/story/'], ['/#contact', '/multiplayer/'], ['/es/#contact', '/es/multiplayer/']]) {
    test(`${from} → ${to}`, async ({ page }) => {
      await page.goto(from);
      await expect(page).toHaveURL(new RegExp(`${to.replace(/\//g, '\\/')}$`));
    });
  }
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('everything is reachable with plain links: menu, Quick picks, chapters, old #anchors land on a visible link', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.menu-hint')).toBeHidden();
    await page.getByRole('link', { name: /^Story mode/ }).click();
    await expect(page).toHaveURL(/\/story\/$/);
    for (const slug of CASES) {
      await page.locator('.next-chapter').click();
      await expect(page).toHaveURL(new RegExp(`/${slug}/$`));
    }
    await page.locator('.story-end').getByRole('link', { name: /Multiplayer/ }).click();
    await expect(page.locator('.ticket a[href^="mailto:"]')).toBeVisible();

    await page.goto('/#levante');
    await expect(page.locator('#levante a')).toBeInViewport();
    await expect(page.locator('#levante a')).toHaveAttribute('href', '/levante/');
    for (const id of ['about', 'contact']) await expect(page.locator(`#${id}`)).toHaveCount(1);
  });
});

test('the new pages have Open Graph tags', async ({ page, request }) => {
  for (const path of ['/story/', '/play/', '/multiplayer/', '/es/story/', '/it/multiplayer/']) {
    await page.goto(path);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://ricccardo15.github.io${path}`);
    for (const prop of ['og:title', 'og:description', 'og:image', 'og:image:alt']) await expect(page.locator(`meta[property="${prop}"]`), prop).toHaveAttribute('content', /.+/);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect((await request.get(new URL(og).pathname)).status(), og).toBe(200);
  }
});
