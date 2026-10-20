// All the pixel art of the site, drawn in code (no external assets, no photos):
//   npm run art → public/game/field.png, runner.png + runner.json, icons.png, title.svg
// Every colour comes from src/palette.js. Edit the files in scripts/art/ and run again.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { field } from './art/field.js';
import { runner } from './art/runner.js';
import { icons } from './art/icons.js';
import { title } from './art/title.js';

const dir = new URL('../public/game/', import.meta.url);
const out = (name) => fileURLToPath(new URL(name, dir));

await mkdir(dir, { recursive: true });
await Promise.all([field(out), runner(out), icons(out), title(out)]);
console.log('✓ public/game: field.png, runner.png, runner.json, icons.png, title.svg');
