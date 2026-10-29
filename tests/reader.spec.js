import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Fase 2.5: read a case without leaving the stadium (src/reader.js).
const reader = (page) => page.locator('dialog.reader');
const duplicateIds = (page) => page.evaluate(() => {
  const seen = new Map();
  for (const el of document.querySelectorAll('[id]')) seen.set(el.id, (seen.get(el.id) ?? 0) + 1);
  return [...seen].filter(([, n]) => n > 1).map(([id]) => id);
});

test.describe('case reader @ 1280×800', () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'reduce' }); });

  test('"Start here" opens Nipotyno in the reader: the address changes, no duplicate ids, axe is clean; Esc closes it', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 120));
    const start = page.locator('.player-card').getByRole('link', { name: /^Start here/ });
    await start.click();
    await expect(reader(page)).toBeVisible();
    await expect(page).toHaveURL(/\/nipotyno\/$/);
    await expect(page.getByRole('dialog', { name: /Nipotyno/ })).toBeVisible();
    await expect(reader(page).locator('article.case h1')).toContainText('Nipotyno');
    await expect(reader(page).locator('.reader-band .band-name svg')).toBeVisible(); // the pixel name
    expect(await duplicateIds(page)).toEqual([]);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);

    await page.keyboard.press('Escape');
    await expect(reader(page)).toBeHidden();
    await expect(page).toHaveURL(/\/$/);
    await expect(start).toBeFocused();
    expect(await page.evaluate(() => Math.round(window.scrollY))).toBe(120); // the page is where it was
  });

  test('from a card in the stadium: Back closes the reader and the card is still there; ✕ works too', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Enter the ballpark' }).click();
    await page.locator('.stage [data-stop="levante"]').click();
    const read = page.locator('#field-panel [data-panel="levante"]').getByRole('link', { name: /Read the case study/ });
    await read.click();
    await expect(reader(page)).toBeVisible();
    await expect(page).toHaveURL(/\/levante\/$/);
    await page.goBack();
    await expect(reader(page)).toBeHidden();
    await expect(page).toHaveURL(/#levante$/);
    await expect(page.locator('#field-panel [data-panel="levante"]')).toBeVisible();
    await expect(read).toBeFocused();

    await read.click();
    await expect(reader(page)).toBeVisible();
    await reader(page).getByRole('button', { name: 'Back to the ballpark' }).click();
    await expect(reader(page)).toBeHidden();
    await expect(page).toHaveURL(/#levante$/);
  });

  test('previous / next stay in the reader; one Back still returns to the stadium; "All case studies" goes to the list', async ({ page }) => {
    await page.goto('/sensor-lab/');
    await page.goto('/');
    await page.locator('#work').getByRole('link', { name: /Knowing in hours/ }).click(); // the Levante card of the list
    await expect(reader(page).locator('article.case h1')).toContainText('Levante');
    await reader(page).locator('.pager a[rel="next"]').click();
    await expect(reader(page).locator('article.case h1')).toContainText('Sensor lab');
    await expect(page).toHaveURL(/\/sensor-lab\/$/);
    expect(await duplicateIds(page)).toEqual([]);
    await page.goBack();
    await expect(reader(page)).toBeHidden();
    await expect(page).toHaveURL(/localhost:\d+\/(#.*)?$/);

    await page.locator('#work').getByRole('link', { name: /Knowing in hours/ }).click();
    await reader(page).locator('.crumb').getByRole('link', { name: 'All case studies' }).click();
    await expect(reader(page)).toBeHidden();
    await expect(page.locator('#work')).toBeInViewport();
  });

  test('a reload on the reader address opens the normal static page (Open Graph, PDF)', async ({ page }) => {
    await page.goto('/');
    await page.locator('.player-card').getByRole('link', { name: /^Start here/ }).click();
    await expect(page).toHaveURL(/\/nipotyno\/$/);
    await page.reload();
    await expect(page.locator('dialog.reader')).toHaveCount(0);
    await expect(page.locator('h1')).toContainText('Nipotyno');
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://ricccardo15.github.io/nipotyno/');
    await expect(page.locator('.case-band').getByRole('link', { name: /Back to the ballpark/ })).toHaveAttribute('href', '/#nipotyno');
  });

  test('if the case cannot be fetched, the link just navigates', async ({ page }) => {
    await page.route('**/levante/', (route) => (route.request().resourceType() === 'fetch' ? route.fulfill({ status: 500, body: 'no' }) : route.continue()));
    await page.goto('/');
    await page.locator('#work').getByRole('link', { name: /Knowing in hours/ }).click();
    await expect(page).toHaveURL(/\/levante\/$/);
    await expect(page.locator('dialog.reader')).toHaveCount(0);
    await expect(page.locator('h1')).toContainText('Levante');
  });

  test('reading a case during the tour does not end the tour', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Enter the ballpark' }).click();
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(page.locator('.tour-count')).toHaveText('1 of 3 · Nipotyno');
    await page.locator('#field-panel [data-panel="nipotyno"]').getByRole('link', { name: /Read the case study/ }).click();
    await expect(reader(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(reader(page)).toBeHidden();
    await expect(page.locator('.tour-count')).toHaveText('1 of 3 · Nipotyno');
    await expect(page.getByRole('button', { name: /Next base: Levante/ })).toBeVisible();
  });

  test('from the lobby to a case read in 3 clicks or fewer, without scrolling', async ({ page }) => {
    await page.goto('/');
    const steps = [
      page.getByRole('link', { name: 'Enter the ballpark' }),
      page.locator('.stage [data-stop="nipotyno"]'),
      page.locator('#field-panel [data-panel="nipotyno"]').getByRole('link', { name: /Read the case study/ }),
    ];
    for (const step of steps) {
      await expect(step).toBeInViewport(); // visible where it is: no scrolling needed
      await step.click();
    }
    await expect(reader(page).locator('article.case h1')).toBeInViewport();
    await expect(reader(page).locator('article.case h1')).toContainText('Nipotyno');
  });
});

test.describe('case reader @ 390×844', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('opens and closes on a phone, the case is readable', async ({ page }) => {
    await page.goto('/');
    await page.locator('.player-card').getByRole('link', { name: /^Start here/ }).tap();
    await expect(reader(page)).toBeVisible();
    await expect(reader(page).locator('article.case h1')).toBeInViewport();
    expect(await page.evaluate(() => document.querySelector('dialog.reader').scrollWidth <= window.innerWidth)).toBe(true);
    await reader(page).getByRole('button', { name: 'Back to the ballpark' }).tap();
    await expect(reader(page)).toBeHidden();
  });
});

test.describe('case reader without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the links are normal links to the static pages', async ({ page }) => {
    await page.goto('/');
    await page.locator('.player-card').getByRole('link', { name: /^Start here/ }).click();
    await expect(page).toHaveURL(/\/nipotyno\/$/);
    await expect(page.locator('h1')).toContainText('Nipotyno');
  });
});
