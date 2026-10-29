// All the pixel art of the site, drawn in code (no external assets, no photos):
//   npm run art → public/game/field.png, night.png (F6), runner.png + runner.json, crew.png + crew.json, icons.png, title.svg
//                 and the placeholder cover public/assets/sensor-lab/cover.webp (scripts/art/sensor-lab-cover.js)
// Every colour comes from src/palette.js. Edit the files in scripts/art/ and run again.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { field, night } from './art/field.js';
import { runner } from './art/runner.js';
import { crew } from './art/crew.js';
import { sensorLabCover } from './art/sensor-lab-cover.js';
import { icons } from './art/icons.js';
import { title } from './art/title.js';

const dir = new URL('../public/game/', import.meta.url);
const out = (name) => fileURLToPath(new URL(name, dir));

await mkdir(dir, { recursive: true });
await Promise.all([field(out), night(out), runner(out), crew(out), icons(out), title(out), sensorLabCover()]);
console.log('✓ public/game: field.png, night.png, runner.png + json, crew.png + json, icons.png, title.svg · public/assets/sensor-lab/cover.webp');
