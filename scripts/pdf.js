// Case-study PDFs: after `vite build`, open each case page from dist/ in Chromium (the browser of the tests)
// and print it with the print CSS of src/style.css → dist/pdf/Riccardo_Cirillo_<Case>.pdf
// Runs as part of `npm run build`. Manual run (after a build): node scripts/pdf.js
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { CASES, pdfName } from './pages.js';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.json': 'application/json' };

// A tiny static server for dist/ (the pages use absolute paths like /assets/…, so file:// would not work).
const server = createServer(async (req, res) => {
  let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  if (path.endsWith('/')) path += 'index.html';
  try {
    const body = await readFile(join(dist, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  await mkdir(join(dist, 'pdf'), { recursive: true });
  const page = await browser.newPage();
  // Keep the PDFs light: case images go in as JPGs of at most 1400 px (plenty for A4).
  await page.route(/\/assets\/.+\.(webp|png|jpe?g)$/, async (route) => {
    const response = await route.fetch();
    const body = await sharp(await response.body()).resize(1400, 1400, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }).jpeg({ quality: 74 }).toBuffer();
    await route.fulfill({ response, body, headers: { ...response.headers(), 'content-type': 'image/jpeg' } });
  });
  for (const slug of CASES) {
    await page.goto(`${base}/${slug}/`, { waitUntil: 'load' });
    // Lazy images: load them all before printing.
    await page.evaluate(() => Promise.all([...document.images].map((img) => { img.loading = 'eager'; return img.decode().catch(() => {}); })));
    await page.pdf({ path: join(dist, 'pdf', pdfName(slug)), preferCSSPageSize: true, printBackground: true });
  }
  console.log(`✓ PDFs: ${CASES.map(pdfName).join(', ')}`);
} finally {
  await browser.close();
  server.close();
}
