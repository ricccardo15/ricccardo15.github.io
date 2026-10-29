import { test, expect } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

// F1 (v3): three projects only. Housing and Lab live in _archive/ (outside public/) and never reach the build.
// Runs on dist/, which the test server builds first (playwright.config.js).

async function files(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await files(path)));
    else out.push(path);
  }
  return out;
}

test('dist/ has no housing, lab or _archive (pages, images, previews, PDFs)', async () => {
  for (const dir of ['', 'es/', 'it/']) {
    for (const old of ['housing', 'lab']) expect(existsSync(`dist/${dir}${old}`), `dist/${dir}${old}`).toBe(false);
  }
  const all = await files('dist');
  const left = all.filter((f) => /_archive|housing|(^|[/_-])lab([./_-]|$)/i.test(f.replace(/^dist\//, '')) && !/sensor[-_]lab/i.test(f));
  expect(left).toEqual([]);
});

test('no generated page links to /housing/ or /lab/, in any language', async () => {
  const pages = (await files('dist')).filter((f) => f.endsWith('.html'));
  expect(pages.length).toBeGreaterThanOrEqual(21); // 3 languages × (title, story, play, multiplayer + 3 cases)
  for (const page of pages) {
    const html = await readFile(page, 'utf8');
    expect(html, page).not.toMatch(/(href|src|content)="[^"]*\/(housing|lab)\//);
    expect(html, page).not.toMatch(/#(housing|lab)"/);
  }
});

test('the three projects are on the site, in the right order, in every language', async ({ page }) => {
  for (const home of ['/', '/es/', '/it/']) {
    await page.goto(home);
    await expect(page.locator('.picks > li')).toHaveCount(3); // F4: the Quick picks of the title screen
    expect(await page.locator('.picks > li').evaluateAll((cards) => cards.map((c) => c.id))).toEqual(['nipotyno', 'levante', 'sensor-lab']);
  }
  const res = await page.goto('/sensor-lab/');
  expect(res.status()).toBe(200);
  await expect(page.locator('h1')).toContainText('Sensor lab');
  await expect(page.locator('main')).toContainText('Case study in preparation');
  await expect(page.locator('.chapter-progress')).toContainText('Chapter 3 of 3'); // F4: the last chapter of the Story mode
});
