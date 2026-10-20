// Image helper (sharp).
//   npm run images                 → check public/assets: every image is WebP and has no EXIF/GPS data
//   npm run images -- <src> <out>  → convert JPG/PNG in <src> to WebP (max 1600 px wide, metadata stripped) into <out>
// sharp drops all metadata (EXIF, GPS, ICC) unless .withMetadata() is called, so output is clean.
import sharp from 'sharp';
import { readdir, mkdir } from 'node:fs/promises';
import { join, extname, basename, relative } from 'node:path';

const RASTER = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

async function check(dir) {
  let problems = 0;
  let count = 0;
  for await (const file of walk(dir)) {
    const ext = extname(file).toLowerCase();
    if (!RASTER.has(ext)) continue;
    count++;
    const meta = await sharp(file).metadata();
    if (ext !== '.webp') {
      console.log(`✗ not WebP: ${relative('.', file)}`);
      problems++;
    }
    if (meta.exif || meta.xmp || meta.iptc) {
      console.log(`✗ has metadata (EXIF/XMP/IPTC): ${relative('.', file)}`);
      problems++;
    }
  }
  console.log(problems ? `${problems} problem(s) in ${count} images.` : `✓ ${count} images OK: all WebP, no metadata.`);
  process.exitCode = problems ? 1 : 0;
}

async function convert(src, out) {
  await mkdir(out, { recursive: true });
  for await (const file of walk(src)) {
    if (!['.jpg', '.jpeg', '.png'].includes(extname(file).toLowerCase())) continue;
    const target = join(out, `${basename(file, extname(file))}.webp`);
    await sharp(file).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 80 }).toFile(target);
    console.log(`→ ${relative('.', target)}`);
  }
}

const [src, out] = process.argv.slice(2);
if (src && out) await convert(src, out);
else await check('public/assets');
