// All the pixel art of the site, drawn in code (no external assets, no photos):
//   npm run art → public/game/field.png, runner.png + runner.json, crew.png + crew.json, icons.png, title.svg, lobby.png
//                 and the placeholder cover public/assets/sensor-lab/cover.webp (scripts/art/sensor-lab-cover.js)
// Every colour comes from src/palette.js. Edit the files in scripts/art/ and run again.
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { field } from './art/field.js';
import { runner } from './art/runner.js';
import { crew } from './art/crew.js';
import { sensorLabCover } from './art/sensor-lab-cover.js';
import { lobby } from './art/lobby.js';
import { icons } from './art/icons.js';
import { title } from './art/title.js';

const dir = new URL('../public/game/', import.meta.url);
const out = (name) => fileURLToPath(new URL(name, dir));

await mkdir(dir, { recursive: true });
await Promise.all([field(out), runner(out), crew(out), icons(out), title(out), lobby(out), sensorLabCover()]);
console.log('✓ public/game: field.png, runner.png + json, crew.png + json, icons.png, title.svg, lobby.png · public/assets/sensor-lab/cover.webp');
