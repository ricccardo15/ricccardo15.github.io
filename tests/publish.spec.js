import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Before publishing: the 404 page GitHub Pages shows for any address that does not exist ("Lost ball", night theme).
for (const { width, height } of [{ width: 1280, height: 800 }, { width: 390, height: 844 }]) {
  test(`404 "Lost ball" @ ${width} px: three ways back, no errors, no sideways scroll, axe clean`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.setViewportSize({ width, height });
    await page.goto('/404.html');
    await expect(page.locator('body')).toHaveAttribute('data-theme', 'night');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lost ball');
    const links = page.locator('.lost-links a');
    expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute('href')))).toEqual(['/', '/story/', '/multiplayer/']);
    for (const link of await links.all()) await expect(link).toBeInViewport();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    await page.screenshot({ path: `tests/screenshots/v3/final-404-${width}.png` });
  });
}
