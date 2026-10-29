import { test, expect } from '@playwright/test';
import sharp from 'sharp';

// B7: sound toggle, case PDFs, share previews, reduced motion, page weight.
const cases = { nipotyno: 'Nipotyno', levante: 'Levante', 'sensor-lab': 'Sensor_lab' };

test.describe('sound toggle', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('off by default, turns on, is remembered', async ({ page }) => {
    await page.goto('/play/');
    const toggle = page.getByRole('button', { name: 'Sound' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toContainText('off');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toContainText('on');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Sound' })).toHaveAttribute('aria-pressed', 'true');
    // a swing with sound on plays without errors
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Swing!' }).click();
    await expect(page.locator('.tour-count')).toHaveText('1 of 3 · Nipotyno');
    expect(errors).toEqual([]);
  });
});

for (const [slug, name] of Object.entries(cases)) {
  test(`/${slug}/: Download PDF works and the share preview is 1200×630`, async ({ page, request }) => {
    await page.goto(`/${slug}/`);
    const link = page.getByRole('link', { name: /Download PDF/ });
    await expect(link).toHaveAttribute('href', `/pdf/Riccardo_Cirillo_${name}.pdf`);
    const pdf = await request.get(`/pdf/Riccardo_Cirillo_${name}.pdf`);
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toContain('pdf');
    const body = await pdf.body();
    expect(body.subarray(0, 4).toString()).toBe('%PDF');
    expect(body.length).toBeLessThan(2_500_000); // light enough to attach or send

    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /case study by Riccardo Cirillo/);
    const og = new URL(await page.locator('meta[property="og:image"]').getAttribute('content')).pathname;
    const { width, height } = await sharp(await (await request.get(og)).body()).metadata();
    expect([width, height]).toEqual([1200, 630]);
  });
}

test('home share preview is 1200×630 with alt text', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', /Riccardo Cirillo/);
  const og = new URL(await page.locator('meta[property="og:image"]').getAttribute('content')).pathname;
  const { width, height } = await sharp(await (await request.get(og)).body()).metadata();
  expect([width, height]).toEqual([1200, 630]);
});

for (const width of [1280, 390]) {
  test.describe(`/play/ @ ${width} px`, () => {
    test.use({ viewport: { width, height: 800 } });

    test('reduced motion: nothing keeps moving', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/play/');
      await page.getByRole('button', { name: 'Swing!' }).click();
      await expect(page.locator('.tour-count')).toHaveText('1 of 3 · Nipotyno');
      await page.waitForTimeout(100);
      const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
      expect(moving).toBe(0);
    });

    for (const path of ['/', '/play/']) test(`${path}: first load weighs less than 1.5 MB`, async ({ page }) => {
      let bytes = 0;
      page.on('response', async (res) => {
        const body = await res.body().catch(() => null);
        if (body) bytes += body.length;
      });
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(bytes).toBeLessThan(1_500_000);
    });
  });
}
