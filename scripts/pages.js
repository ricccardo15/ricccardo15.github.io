// Page generator: turns content/*.md into real static HTML pages, in three languages (Fase 3).
//   content/<case>.md → <case>/index.html  (e.g. /nipotyno/)          English, the default
//   content/es/<case>.md → es/<case>/index.html  (/es/nipotyno/)       Spanish; the same for Italian (it/)
//   title screen, /story/, /play/, /multiplayer/ (and /es/…, /it/…) are built from the cases' frontmatter, about.md and facts.md (F4)
// Interface strings: src/i18n.js.
// Generated files are in .gitignore: edit content/*.md, never the generated HTML.
// Runs automatically from vite.config.js (dev and build). Manual run: npm run pages
import { readFile, writeFile, mkdir, rm, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import sharp from 'sharp';
import { FIELD, STOPS, SPOTS, CREW, CREW_ROWS, DUGOUT } from '../src/field-map.js';
import { UNIFORMS } from '../src/uniforms.js';
import { PALETTE } from '../src/palette.js';
import { pixelText } from './art/title.js';
import { LANGS, PREFIX, LOCALE, LANG_NAMES, CV_LANG, STRINGS, fill } from '../src/i18n.js';

const SITE = 'https://ricccardo15.github.io';
const EMAIL = 'riccardo.cirillo.work@gmail.com';
// Order on the home and on the diamond: 1st, 2nd, 3rd base (F1: three projects; Housing and Lab are in _archive/).
export const CASES = ['nipotyno', 'levante', 'sensor-lab'];
// PDF of each case (made after the build by scripts/pdf.js from the page itself, with the print CSS).
// English keeps the old names; the other languages get a suffix (Riccardo_Cirillo_Nipotyno_ES.pdf). Spaces → _ (Sensor_lab).
export const pdfName = (slug, lang = 'en') =>
  `Riccardo_Cirillo_${STOPS.find((s) => s.id === slug).name.replace(/ /g, '_')}${lang === 'en' ? '' : `_${lang.toUpperCase()}`}.pdf`;
// Folder of each language in the site ('' = the root for English).
const dirOf = (lang) => (lang === 'en' ? '' : `${lang}/`);
// Pages Vite must build, for every language: title screen, Story mode (chapter 0), Gameplay, Multiplayer, one page per case.
export const PAGES = [
  ...LANGS.flatMap((lang) => ['', 'story/', 'play/', 'multiplayer/', ...CASES.map((slug) => `${slug}/`)].map((key) => `${dirOf(lang)}${key}index.html`)),
  '404.html', // GitHub Pages shows it for any address that does not exist (one page, in English)
];

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

// --- Fonts (F3) ---------------------------------------------------------------
// Self-hosted from npm (@fontsource), latin subset only (it covers á é í ó ú à è ì ò ù ñ ü ¿ ¡). Copied to public/fonts/
// at every dev/build (not hashed, so the two <link rel="preload"> always match). All SIL OFL 1.1: see docs/CREDITS.md.
export const FONTS = [
  ['jersey-10', 'jersey-10-latin-400-normal'],
  ['atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-400-normal'],
  ['atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-700-normal'],
  ['atkinson-hyperlegible-next', 'atkinson-hyperlegible-next-latin-400-italic'],
  ['atkinson-hyperlegible-mono', 'atkinson-hyperlegible-mono-latin-400-normal'],
  ['atkinson-hyperlegible-mono', 'atkinson-hyperlegible-mono-latin-700-normal'],
];
const PRELOAD = ['jersey-10-latin-400-normal', 'atkinson-hyperlegible-next-latin-400-normal']
  .map((f) => `<link rel="preload" as="font" type="font/woff2" href="/fonts/${f}.woff2" crossorigin>`).join('\n    ');

async function copyFonts() {
  await mkdir(root('public/fonts'), { recursive: true });
  for (const [pkg, file] of FONTS) await copyFile(root(`node_modules/@fontsource/${pkg}/files/${file}.woff2`), root(`public/fonts/${file}.woff2`));
  // One licence text per family (the OFL is the same, the copyright lines differ).
  const licences = await Promise.all([...new Set(FONTS.map(([pkg]) => pkg))].map((pkg) => readFile(root(`node_modules/@fontsource/${pkg}/LICENSE`), 'utf8')));
  await writeFile(root('public/fonts/OFL.txt'), licences.join('\n\n---\n\n'));
}

// --- Markdown -------------------------------------------------------------

// Frontmatter = the `key: "value"` block between --- lines at the top of each .md file
// (translations may start with a <!-- [CHECK] … --> note before it).
function parse(source) {
  const match = source.match(/^(?:<!--[\s\S]*?-->\s*)?---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error('missing frontmatter');
  const data = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^(\w+):\s*(.*)$/);
    if (m) data[m[1]] = m[2].startsWith('"') ? JSON.parse(m[2]) : m[2];
  }
  // Drop the <!-- notes --> left for editors: they must not reach the public page.
  return { data, body: match[2].replace(/<!--[\s\S]*?-->\n?/g, '') };
}

const escape = (text) =>
  String(text).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Accents are dropped first ("Investigación" → investigacion, not investigaci-n).
const slugify = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/<[^>]+>|&[#\w]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const sizes = new Map();
async function imageSize(src) {
  if (!sizes.has(src)) {
    const file = root(`public${src}`);
    if (!existsSync(file)) throw new Error(`image not found: public${src}`);
    const { width, height } = await sharp(file).metadata();
    sizes.set(src, { width, height });
  }
  return sizes.get(src);
}

// Images get width/height (no layout jump) and load lazily; tables scroll sideways on phones.
async function markdown(body, t = STRINGS.en) {
  const images = [...body.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]);
  await Promise.all(images.map(imageSize));
  const marked = new Marked({
    renderer: {
      image({ href, text }) {
        const { width, height } = sizes.get(href);
        // --w / --h = the real size: src/style.css uses them to cap the height on screen without a jump when the image loads.
        return `<img src="${href}" alt="${escape(text)}" width="${width}" height="${height}" style="--w: ${width}; --h: ${height}" loading="lazy" decoding="async">`;
      },
    },
  });
  return marked
    .parse(body)
    .replace(/<table>/g, `<div class="table-wrap" tabindex="0" role="region" aria-label="${t.resultsTable}"><table>`)
    .replace(/<\/table>/g, '</table></div>');
}

// Wraps each "## Heading" and the text under it in a <section id="heading">, so every part has a link.
// "## Cómo diseño {#how-i-design}" sets the id by hand: the parts the code looks for keep the same id in every language.
function sections(html, className = '') {
  return html
    .split(/(?=<h2>)/)
    .map((part) => {
      const heading = part.match(/^<h2>(.*?)(?:\s*\{#([\w-]+)\})?<\/h2>/);
      if (!heading) return part.trim();
      const cls = className ? ` class="${className}"` : '';
      const body = `<h2>${heading[1]}</h2>${part.trim().slice(heading[0].length)}`;
      return `<section id="${heading[2] ?? slugify(heading[1])}"${cls}>\n${body}\n</section>`;
    })
    .join('\n');
}

// Paragraphs that contain only an image become <figure> so they can be styled as screenshots.
const figures = (html) => html.replace(/<p>(<img [^>]+>)<\/p>/g, '<figure>$1</figure>');

// --- Open Graph images ------------------------------------------------------

// The previews shown when the link is shared (LinkedIn, WhatsApp, email): 1200×630 JPG (LinkedIn reads WebP badly).
// Text is drawn with the site's own pixel font (scripts/art/title.js), so it looks the same on any build machine.
const OG = { width: 1200, height: 630 };

// Pixel text as a PNG layer for sharp, at an integer scale (nearest neighbour = sharp pixels).
async function pixelLayer(text, scale, colors, left, top) {
  const width = text.length * 8 * scale;
  const input = await sharp(Buffer.from(pixelText(text, colors))).resize(width, 8 * scale, { kernel: 'nearest' }).png().toBuffer();
  return { input, left: left ?? Math.round((OG.width - width) / 2), top };
}
const band = (height) => ({
  input: { create: { width: OG.width, height, channels: 3, background: PALETTE.navy } }, left: 0, top: 0,
});

async function saveOg(name, image) {
  await mkdir(root('public/og'), { recursive: true });
  await image.jpeg({ quality: 84 }).toFile(root(`public/og/${name}.jpg`));
  return `/og/${name}.jpg`;
}

// One preview per language: home.jpg, es-home.jpg, nipotyno.jpg, es-nipotyno.jpg…
const ogName = (L, name) => (L.lang === 'en' ? name : `${L.lang}-${name}`);

// Home: the pixel ballpark at 4× (with Riccardo at bat on home plate) under a navy band with the pixel name and role.
async function ogHome(L) {
  // The 480×270 field at 3× (1440×810, a whole-number scale) cropped to 1200×630, Riccardo (48 px sprite at 3×) at bat.
  const SCALE = 3, CROP = { left: 120, top: 180 };
  const home = STOPS.find((s) => s.id === 'home');
  const batter = await sharp(root('public/game/runner.png'))
    .extract({ left: 9 * 48, top: 0, width: 48, height: 48 }) // swing: the load, Researcher uniform (F6 sheet)
    .resize(48 * SCALE, 48 * SCALE, { kernel: 'nearest' })
    .toBuffer();
  const field = await sharp(root('public/game/field.png'))
    .resize(FIELD.width * SCALE, FIELD.height * SCALE, { kernel: 'nearest' })
    .extract({ ...CROP, width: OG.width, height: OG.height })
    .toBuffer();
  return saveOg(ogName(L, 'home'), sharp(field).composite([
    // feet (row 46 of 48) on home plate
    { input: batter, left: home.x * SCALE - CROP.left - 24 * SCALE, top: home.y * SCALE - CROP.top - 46 * SCALE },
    band(190),
    await pixelLayer('Riccardo Cirillo', 7, { color: PALETTE.white, shadow: PALETTE.red }, undefined, 42),
    await pixelLayer(L.t.ogLine, 3, { color: PALETTE.yellow, shadow: PALETTE.navyDark }, undefined, 128),
  ]));
}

// Case: navy band with the case name in pixels, the cover image below.
async function ogCase(L, slug, src) {
  const stop = L.stop(slug);
  const cover = await sharp(root(`public${src}`))
    .resize(OG.width, OG.height - 150, { fit: 'contain', background: '#f7f4ec' })
    .flatten({ background: '#f7f4ec' })
    .toBuffer();
  const base = sharp({ create: { ...OG, channels: 3, background: '#f7f4ec' } });
  return saveOg(ogName(L, slug), base.composite([
    band(150),
    await pixelLayer(stop.name, 8, { color: PALETTE.white, shadow: PALETTE.red }, 60, 28),
    await pixelLayer(`${stop.label} · ${L.t.ogCaseBy}`, 2, { color: PALETTE.yellow, shadow: PALETTE.navyDark }, 60, 112),
    { input: cover, left: 0, top: 150 },
  ]));
}

// --- Layout -----------------------------------------------------------------

// Everything that changes with the language of the page: L.t = the strings, L.p = the address prefix ('', '/es', '/it'),
// the bases and points with their translated labels, the uniforms with their translated skills.
function context(lang) {
  const t = STRINGS[lang];
  const point = (q) => ({ ...q, ...(t.points?.[q.id] ?? {}) });
  const stops = STOPS.map(point);
  return {
    lang,
    t,
    p: PREFIX[lang],
    stops,
    stop: (id) => stops.find((s) => s.id === id),
    uniforms: UNIFORMS.map((u) => ({ ...u, ...(t.uniforms?.[u.id] ?? {}) })),
    // A piece of content/facts.md (English) in this language. A missing translation stops the build.
    tr(piece) {
      if (lang === 'en') return piece;
      if (!t.facts_md[piece]) throw new Error(`src/i18n.js: no ${lang} translation for "${piece}" (from content/facts.md)`);
      return t.facts_md[piece];
    },
  };
}

// lang + hreflang on a link whose target (or text) is in another language than the page (WCAG 3.1.2).
const langAttr = (L, lang) => (lang === L.lang ? '' : ` hreflang="${lang}" lang="${lang}"`);

// The CVs: the link text is in the CV's own language, the CV of the page's language comes first.
const CV = {
  en: { href: '/cv/CV_Riccardo_Cirillo_EN.pdf', short: 'English', button: 'CV · English (PDF)' },
  es: { href: '/cv/CV_Riccardo_Cirillo_ES.pdf', short: 'Español', button: 'CV en español (PDF)' },
};
const cvOrder = (L) => (CV_LANG[L.lang] === 'es' ? ['es', 'en'] : ['en', 'es']);
const cvLink = (L, lang, text, cls) => `<a${cls ? ` class="${cls}"` : ''} href="${CV[lang].href}"${langAttr(L, lang)}>${text}</a>`;
// "CV ↓" in the bars on top: the CV of the page's language (EN for EN and IT, ES for ES).
const cvTop = (L) => {
  const lang = CV_LANG[L.lang];
  return cvLink(L, lang, `CV <abbr title="${CV[lang].short}">${lang.toUpperCase()}</abbr> <span aria-hidden="true">↓</span>`, 'cv-top');
};

// EN · ES · IT, like a scoreboard: each one leads to the same page in that language.
// The choice is remembered (a click saves it); only "/" sends a visitor who chose ES or IT to their language.
function langSwitch(L, key) {
  const items = LANGS.map((lang) => {
    const current = lang === L.lang ? ' aria-current="page"' : '';
    return `<li><a href="${PREFIX[lang]}${key}" hreflang="${lang}" lang="${lang}" data-lang="${lang}"${key === '/' || key === '/play/' ? ' data-home' : ''}${current}>${lang.toUpperCase()}<span class="visually-hidden"> ${LANG_NAMES[lang]}</span></a></li>`;
  });
  return `<nav class="lang-switch" aria-label="${escape(L.t.langLabel)}">
          <ul>${items.join('')}</ul>
        </nav>`;
}
// Saves the choice on click; on the title screen the #anchor goes along to the other language.
const LANG_SCRIPT = `<script>for (const a of document.querySelectorAll('[data-lang]')) a.addEventListener('click', () => { try { localStorage.setItem('lang', a.dataset.lang); } catch {} if (a.hasAttribute('data-home')) a.hash = location.hash; });</script>`;
// Old addresses of the v2 home (F4): /#nipotyno → /nipotyno/, /#about → /story/, /#contact → /multiplayer/, /#field → /play/.
// Without JS the same ids are on the title screen (the Quick picks cards and the menu items), so the link still lands
// on something visible that leads there. On "/" a visitor who CHOSE Spanish or Italian goes there first (never guessed).
const OLD_HASHES = { nipotyno: 'nipotyno/', levante: 'levante/', 'sensor-lab': 'sensor-lab/', about: 'story/', how: 'story/', contact: 'multiplayer/', field: 'play/', home: 'play/' };
const titleScript = (L) => `<script>(() => { const h = location.hash; ${L.lang === 'en' ? "try { const l = localStorage.getItem('lang'); if (l === 'es' || l === 'it') return location.replace('/' + l + '/' + h); } catch {} " : ''}const to = ${JSON.stringify(OLD_HASHES)}[h.slice(1)]; if (to) location.replace('${L.p}/' + to); })();</script>`;

// The modes of the site (F4). The mode bar is the same on every page but the title screen.
const MODES = ['story', 'play', 'multiplayer'];
const modeHref = (L, mode) => `${L.p}/${mode}/`;
function modeBar(L, key, current) {
  const { t } = L;
  const items = MODES.map((mode) => {
    const here = mode === current ? ` aria-current="${key === `/${mode}/` ? 'page' : 'true'}"` : '';
    return `<li><a class="mode" href="${modeHref(L, mode)}"${here}>${escape(t.modes[mode].name)}</a></li>`;
  });
  return `<header class="site-header mode-bar" data-theme="night">
      <div class="wrap wide bar">
        <a class="to-title" href="${L.p}/"><span aria-hidden="true">◀</span> ${escape(t.titleScreen)}</a>
        <nav class="modes" aria-label="${escape(t.modesLabel)}">
          <ul>
            ${items.join('\n            ')}
          </ul>
        </nav>
        ${langSwitch(L, key)}
        ${cvTop(L)}
      </div>
    </header>`;
}
// The title screen has its own bar: name · EN ES IT · CV ↓ · Contact.
function titleBar(L, key) {
  return `<header class="site-header title-bar" data-theme="night">
      <div class="wrap wide bar">
        <a class="brand" href="${L.p}/" aria-current="page">Riccardo Cirillo</a>
        ${langSwitch(L, key)}
        ${cvTop(L)}
        <a class="contact-top" href="${modeHref(L, 'multiplayer')}">${escape(L.t.contactShort)}</a>
      </div>
    </header>`;
}

// key = the page's address without the language prefix ('/' or '/nipotyno/').
// theme = 'paper' (Story, cases, Multiplayer) or 'night' (title screen, game): the colours in src/style.css.
// mode = the mode the page belongs to (lit in the mode bar); none = the title screen and its own bar.
// index = false: a page search engines must not list (the 404): no canonical, no alternates, noindex.
function layout(L, { title, description, key, image, imageAlt, main, bodyClass = '', scripts = '', theme = 'paper', mode = null, head = '', index = true }) {
  const { t } = L;
  const url = `${SITE}${L.p}${key}`;
  const alternates = [
    ...LANGS.map((lang) => `<link rel="alternate" hreflang="${lang}" href="${SITE}${PREFIX[lang]}${key}">`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${key}">`,
  ];
  return `<!doctype html>
<html lang="${L.lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${head}
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}">
    ${index ? `<link rel="canonical" href="${url}">\n    ${alternates.join('\n    ')}` : '<meta name="robots" content="noindex">'}
    <meta property="og:locale" content="${LOCALE[L.lang]}">
    ${LANGS.filter((lang) => lang !== L.lang).map((lang) => `<meta property="og:locale:alternate" content="${LOCALE[lang]}">`).join('\n    ')}
    <meta property="og:type" content="${key === '/' ? 'website' : 'article'}">
    <meta property="og:site_name" content="Riccardo Cirillo · UX Research &amp; Design">
    <meta property="og:title" content="${escape(title)}">
    <meta property="og:description" content="${escape(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE}${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escape(imageAlt)}">
    <meta name="twitter:card" content="summary_large_image">
    ${PRELOAD}
    <link rel="stylesheet" href="/src/style.css">
    ${scripts}
  </head>
  <body data-theme="${theme}"${bodyClass ? ` class="${bodyClass}"` : ''}>
    <a class="skip" href="#main">${escape(t.skip)}</a>
    ${mode ? modeBar(L, key, mode) : titleBar(L, key)}
    <main id="main" tabindex="-1">
${main}
    </main>
    <footer class="site-footer" data-theme="night">
      <div class="wrap wide">
        <p><strong>Riccardo Cirillo</strong> · ${escape(t.headline)}</p>
        <p><a href="mailto:${EMAIL}">${EMAIL}</a> · CV: ${cvLink(L, 'en', CV.en.short)} · ${cvLink(L, 'es', CV.es.short)}</p>
      </div>
    </footer>
    ${LANG_SCRIPT}
  </body>
</html>
`;
}

// The pieces of content/facts.md a recruiter in Madrid looks for first (single source of truth; the build stops if they change shape).
// "EU citizen with Spanish NIE · Available…" → ['EU citizen', 'Spanish NIE']; "English (B2 – IELTS…)" → "English B2".
// In ES and IT each piece goes through L.tr (src/i18n.js), so a new fact without its translation stops the build too.
async function factPieces(L) {
  const facts = await readFile(root('content/facts.md'), 'utf8');
  const field = (name) => facts.match(new RegExp(`^- ${name}: (.+)$`, 'm'))?.[1];
  const status = field('Status')?.split(' · ')[0].split(' with ');
  const languages = field('Languages')?.split(' · ').map((l) => l.replace(/^(\w+) \((B[12]|C[12])\b[^)]*\)$/, '$1 $2'));
  if (status?.length !== 2 || !languages?.length) throw new Error('content/facts.md: the "Status" or "Languages" line is missing or has another shape');
  const schools = [field('Education'), ...[...facts.matchAll(/^ {2}- (.+)$/gm)].map((m) => m[1])].filter(Boolean);
  if (schools.length < 4) throw new Error('content/facts.md: the Education lines are missing');
  return {
    status: status.map((p) => L.tr(p)),
    languages: languages.map((p) => L.tr(p)),
    thesis: L.tr("Curricular internship + master's thesis"),
    schools: schools.map((s) => L.tr(s)),
  };
}

const shortName = (c) => c.data.title.split(' — ')[0];
const subtitle = (c) => c.data.title.split(' — ').slice(1).join(' — ');

function facts(L, data) {
  const f = L.t.facts;
  const rows = [
    [f.role, data.role],
    [f.team, data.team],
    [f.context, data.context],
    [f.when, data.duration],
    [f.tools, data.tools],
  ].filter(([, value]) => value);
  return `<dl class="facts">\n${rows.map(([k, v]) => `<div><dt>${escape(k)}</dt><dd>${escape(v)}</dd></div>`).join('\n')}\n</dl>`;
}

// Key numbers ("13 interviews · 6 testers · SUS 78.75") → big number + small label, for the scoreboard strip.
// "SUS 78.75" → 78.75 / SUS; "~48 h → ~3 h (concept)" → ~48 h → ~3 h / (concept); "team of 6" stays whole (no dangling "of").
function statParts(stat) {
  let m = stat.match(/^(~?[\d.,/]+(?:\s?h)?(?:\s?→\s?~?[\d.,/]+(?:\s?h)?)?)\s*(.*)$/);
  if (m) return [m[1], m[2]];
  m = stat.match(/^(.*?)\s+(~?[\d.,/]+)$/);
  if (m && !/\b(of|de|di|da)$/.test(m[1])) return [m[2], m[1]];
  return [stat, ''];
}
const hasNumbers = (data) => /\d/.test(data.stats ?? '');
const scoreStrip = (L, data) => (hasNumbers(data)
  ? `<ul class="score-strip" aria-label="${escape(L.t.keyNumbers)}">${data.stats.split(' · ').map((s) => {
    const [big, small] = statParts(s);
    return `<li><strong>${escape(big)}</strong>${small ? ` <span>${escape(small)}</span>` : ''}</li>`;
  }).join('')}</ul>`
  : '');

// "Chapter 1 of 3" + three little bars (Story mode). n = 0 on the warm-up (/story/).
function progress(L, n) {
  const label = n ? fill(L.t.chapterOf, { n, total: CASES.length }) : L.t.warmUp;
  const bars = CASES.map((_, i) => `<i${i < n ? ' class="is-done"' : ''}></i>`).join('');
  return `<p class="chapter-progress"><span>${escape(label)}</span> <span class="bars" aria-hidden="true">${bars}</span></p>`;
}

// The bottom of every Story page: "◀ Title screen" and one big "Next chapter ▶"; after chapter 3, the end of the story.
function chapterNav(L, next, n) {
  const { t, p } = L;
  const back = `<a class="to-title-link" href="${p}/"><span aria-hidden="true">◀</span> ${escape(t.titleScreen)}</a>`;
  if (next) {
    return `<nav class="chapter-nav" aria-label="${escape(t.modes.story.name)}">
          ${back}
          <a class="next-chapter" href="${p}/${next.data.slug}/" rel="next"><span class="next-label">${escape(t.nextChapter)} · ${escape(fill(t.nOfTotal, { n: n + 1, total: CASES.length }))}</span> <span class="next-name">${escape(shortName(next))} <span aria-hidden="true">▶</span></span></a>
        </nav>`;
  }
  return `<section class="story-end" aria-labelledby="story-end-title">
          <h2 id="story-end-title">${escape(t.endTitle)}</h2>
          <p>${escape(t.endText)}</p>
          <ul class="actions">
            <li><a class="button" href="${modeHref(L, 'multiplayer')}">${escape(t.modes.multiplayer.name)}: ${escape(t.modes.multiplayer.short)}</a></li>
            <li><a class="button ghost" href="${modeHref(L, 'play')}">${escape(t.playTheGame)}</a></li>
          </ul>
          <p>${back}</p>
        </section>`;
}

// A case study = one chapter of the Story mode (F4): progress, big number + title, the player card (role, team, when,
// PDF) next to the key numbers and the text, then "Next chapter ▶" (or the end of the story after chapter 3).
async function casePage(L, c, i, all) {
  const { data } = c;
  const { t, p } = L;
  let html = figures(await markdown(c.body, t));
  html = sections(html);
  html = html.replace('<section id="tl-dr">', '<section id="tl-dr" class="tldr">');
  const n = i + 1;

  const main = `      <article class="case chapter wrap wide">
        <p class="print-head">Riccardo Cirillo · ${escape(t.headline.split(' · ')[0])} · ${EMAIL} · ${SITE.replace('https://', '')}${p}/${data.slug}/</p>
        ${progress(L, n)}
        <header class="chapter-head">
          <span class="chapter-no" aria-hidden="true">${String(n).padStart(2, '0')}</span>
          <h1 id="case-title" tabindex="-1">${escape(shortName(c))}${subtitle(c) ? `<span class="sub">${escape(subtitle(c))}</span>` : ''}</h1>
        </header>
        <div class="chapter-grid">
          <aside class="scorecard" aria-labelledby="scorecard-title">
            <h2 id="scorecard-title" class="kicker">${escape(t.playerCard)}</h2>
            ${facts(L, data)}
            <p class="pdf"><a href="/pdf/${pdfName(data.slug, L.lang)}">${escape(t.downloadPdf)}<span class="visually-hidden">${escape(t.ofThisCase)}</span> <span aria-hidden="true">↓</span></a></p>
          </aside>
          <div class="chapter-body">
            ${scoreStrip(L, data)}
            ${html}
          </div>
        </div>
        ${chapterNav(L, all[i + 1], n)}
      </article>`;

  return layout(L, {
    title: `${shortName(c)} · ${subtitle(c) || 'Riccardo Cirillo'} · Riccardo Cirillo`,
    description: data.description,
    key: `/${data.slug}/`,
    image: await ogCase(L, data.slug, data.og_image),
    imageAlt: `${shortName(c)}, ${t.caseBy} (${L.stop(data.slug).label})`,
    main,
    mode: 'story',
  });
}

// --- Gameplay (/play/, F5) ----------------------------------------------------------------
// The game is the page: a HUD on top (⏸ Pause · Esc, the base, the bases visited, sound), the pixel field, one small card
// per base, and a pause menu that leads to the other modes. Four points: 1st Nipotyno, 2nd Levante, 3rd Sensor lab,
// home plate = Multiplayer (Contact & CV). The scoreboard, the mound, the ticket booth, the bullpen and the dugout are scenery.
// Without JavaScript the bases are plain links and a sentence links the three case pages and the Story mode.
// Under 1000 px the field is at 1× with icon-only labels and the "Stadium map" list under it (see style.css).
const POINTS = [...STOPS, ...SPOTS]; // the order of public/game/icons.png
const pointHref = (L, p) => (p.id === 'home' ? modeHref(L, 'multiplayer') : `${L.p}/${p.id}/`);
const iconOf = (p) => POINTS.findIndex((q) => q.id === p.id);

// The content of one "## Heading" section of content/about.md, without its heading and without its id (no duplicate ids).
function aboutSection(aboutParts, id) {
  const part = aboutParts.find((p) => p.startsWith(`<section id="${id}"`));
  if (!part) throw new Error(`content/about.md: section "${id}" not found`);
  return part.replace(/^<section[^>]*>\s*<h2>[\s\S]*?<\/h2>\s*/, '').replace(/\s*<\/section>\s*$/, '');
}

async function ballpark(L, cases) {
  const { t, p: prefix } = L;
  const pct = (value, total) => `${+((value / total) * 100).toFixed(3)}%`;
  const point = (id) => L.stops.find((q) => q.id === id);

  const points = L.stops.map((p) => `                  <li><a class="base" href="${pointHref(L, p)}" data-stop="${p.id}" data-tag="${p.tag}" style="--x: ${pct(p.x, FIELD.width)}; --y: ${pct(p.y, FIELD.height)}; --icon: ${iconOf(p)}"><span class="base-icon"></span><span class="base-text"><span class="base-label">${escape(p.label)}</span> <span class="base-name">${escape(p.name)}</span></span></a></li>`);
  const legend = L.stops.map((p) => `          <li><a href="${pointHref(L, p)}" data-stop="${p.id}"><span class="base-icon" style="--icon: ${iconOf(p)}" aria-hidden="true"></span> <span class="map-name">${escape(p.name)}</span> <span class="map-label">${escape(p.label)}</span></a></li>`);
  // Crew sprites (coaches, teammates, pitcher): decoration only, so hidden from screen readers.
  const crew = CREW.map((m) => `                  <div class="sprite crew-sprite${m.flip ? ' is-flipped' : ''}" data-crew="${m.id}" style="--x: ${pct(m.x, FIELD.width)}; --y: ${pct(m.y, FIELD.height)}; --row: ${CREW_ROWS.indexOf(m.who)}"></div>`);
  const covers = Object.fromEntries(await Promise.all(cases.map(async ({ data }) => [data.slug, { src: data.cover, ...(await imageSize(data.cover)) }])));
  const kicker = (id) => `${escape(point(id).label)} · ${escape(point(id).name)}`;

  // The cards: little to read (F5). A case = cover, name, one line, key numbers, Read the case study (the real page).
  const panels = [
    `          <article class="panel-card" data-panel="home" hidden>
            <p class="kicker">${kicker('home')}</p>
            <h2>${escape(t.modes.multiplayer.name)}</h2>
            <p class="panel-email"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
            <ul class="actions">
              ${cvOrder(L).map((lang, i) => `<li>${cvLink(L, lang, CV[lang].button, i ? 'button ghost' : 'button')}</li>`).join('\n              ')}
            </ul>
            <p><a href="${modeHref(L, 'multiplayer')}">${escape(t.openMultiplayer)}</a></p>
          </article>`,
    ...cases.map(({ data }) => {
      const cover = covers[data.slug];
      const numbers = hasNumbers(data) ? `<ul class="key-numbers" aria-label="${escape(t.keyNumbers)}">${data.stats.split(' · ').map((n) => `<li>${escape(n)}</li>`).join('')}</ul>` : '';
      return `          <article class="panel-card" data-panel="${data.slug}" hidden>
            <img class="panel-cover" src="${cover.src}" alt="" width="${cover.width}" height="${cover.height}" loading="lazy" decoding="async">
            <p class="kicker">${kicker(data.slug)}</p>
            <h2>${escape(shortName({ data }))}<span class="sub">${escape(subtitle({ data }))}</span></h2>
            ${numbers}
            <p class="card-links"><a class="button" href="${prefix}/${data.slug}/">${escape(t.read)}<span class="visually-hidden">: ${escape(shortName({ data }))}</span></a></p>
          </article>`;
    }),
    `          <article class="panel-card game-over" data-panel="done" hidden>
            <p class="kicker">${escape(t.tourDoneKicker)}</p>
            <h2>${escape(t.gameOver)}</h2>
            <ul class="actions">
              <li><a class="button" href="${modeHref(L, 'story')}">${escape(t.readStory)}</a></li>
              <li><a class="button ghost" href="${modeHref(L, 'multiplayer')}">${escape(t.modes.multiplayer.name)}</a></li>
              <li><button class="button ghost" type="button" data-action="again">${escape(t.playAgain)}</button></li>
            </ul>
          </article>`,
  ];

  const tiles = L.uniforms.map((u) => `                  <li><button class="uniform-tile" type="button" data-uniform="${u.id}" aria-pressed="false"><span class="portrait" style="--row: ${u.row}" aria-hidden="true"></span> <span class="tile-name">${escape(u.label)}</span></button></li>`);
  const langs = LANGS.map((lang) => `<a href="${PREFIX[lang]}/play/" hreflang="${lang}" lang="${lang}" data-lang="${lang}" data-home${lang === L.lang ? ' aria-current="page"' : ''}>${lang.toUpperCase()}<span class="visually-hidden"> ${LANG_NAMES[lang]}</span></a>`);
  const pauseItem = (tag, attrs, name, sub = '') => `            <li><${tag} class="pause-item" ${attrs}><span class="pause-name">${escape(name)}</span>${sub ? ` <span class="pause-sub">${sub}</span>` : ''}</${tag}></li>`;

  // data-strings: the few sentences of the game's JavaScript, in the page's language (src/game.js reads them).
  return `      <section id="field" class="field" data-theme="night" aria-labelledby="field-title" data-strings="${escape(JSON.stringify(t.game))}">
        <div class="hud">
          <button class="hud-pause" type="button" data-action="pause" aria-haspopup="dialog" hidden><span aria-hidden="true">⏸</span> ${escape(t.pause)}<span class="no-touch" aria-hidden="true"> · Esc</span></button>
          <h1 id="field-title" class="hud-title">${escape(t.modes.play.name)}</h1>
          <p class="hud-base" aria-hidden="true"></p>
          <span class="hud-diamonds" aria-hidden="true" hidden><i data-corner="first"></i><i data-corner="second"></i><i data-corner="third"></i></span>
          <button class="hud-sound sound-toggle" type="button" data-action="sound" aria-pressed="false" hidden><span aria-hidden="true">♪</span> <span class="sound-word">${escape(t.sound)}<span aria-hidden="true">:</span></span> <span class="state" aria-hidden="true">${escape(t.game.off)}</span></button>
        </div>
        <p class="no-game wrap wide">${escape(t.noGame)} ${cases.map(({ data }) => `<a href="${prefix}/${data.slug}/">${escape(shortName({ data }))}</a>`).join(' · ')} · <a href="${modeHref(L, 'story')}">${escape(t.modes.story.name)}</a></p>
        <div class="ballpark">
          <div class="stage-col">
            <div class="stage">
              <div class="field-box">
                <div class="world">
                  <img class="field-img" src="/game/field.png" alt="${escape(t.fieldAlt)}" width="${FIELD.width}" height="${FIELD.height}">
${crew.join('\n')}
                  <div class="sprite runner" style="--x: ${pct(DUGOUT.x, FIELD.width)}; --y: ${pct(DUGOUT.y, FIELD.height)}"></div>
                  <div class="ball" hidden></div>
                </div>
                <ul class="bases" aria-label="${escape(t.stadium)}">
${points.join('\n')}
                </ul>
              </div>
              <div class="swing-box" hidden><button class="button swing" type="button" data-action="swing"><span aria-hidden="true">⚾</span> ${escape(t.swing)}</button></div>
              <p class="banner" aria-hidden="true" hidden>${escape(t.homeRun)}</p>
            </div>
            <div class="game-bar" hidden>
              <section class="uniform-pick bar-row" data-mode="pick" aria-labelledby="pick-title" hidden>
                <h2 id="pick-title">${escape(t.chooseUniform)}</h2>
                <ul class="uniform-tiles">
${tiles.join('\n')}
                </ul>
                <button class="link pick-skip" type="button" data-action="skip-uniform">${escape(t.skipUniform)} <span aria-hidden="true">▶</span></button>
              </section>
              <div class="bar-row" data-mode="bat">
                <p class="bar-hint"><strong>${escape(t.orClick)}</strong><span class="no-touch"> ${t.pressSpace}</span></p>
              </div>
              <div class="bar-row" data-mode="tour" hidden>
                <button class="link" type="button" data-action="free"><span aria-hidden="true">✕</span> ${escape(t.exitTour)}</button>
              </div>
              <div class="bar-row" data-mode="free" hidden>
                <p class="bar-hint">${t.freeHint}</p>
              </div>
              <p class="visually-hidden" role="status"></p>
            </div>
          </div>
          <div class="panel" id="field-panel" tabindex="-1" role="region" aria-label="${escape(t.card)}" hidden>
            <button class="panel-close" type="button" data-action="close"><span aria-hidden="true">✕</span> ${escape(t.close)}</button>
${panels.join('\n')}
          </div>
        </div>
        <nav class="stadium-map wrap wide" aria-labelledby="map-title">
          <h2 id="map-title">${escape(t.stadiumMap)}</h2>
          <ul>
${legend.join('\n')}
          </ul>
        </nav>
        <dialog class="pause" aria-labelledby="pause-title">
          <h2 id="pause-title">${escape(t.paused)}</h2>
          <ul class="pause-menu">
${pauseItem('button', 'type="button" data-action="resume"', t.resume)}
${pauseItem('a', `href="${prefix}/nipotyno/" data-read-this`, t.readThis, `<span class="read-this-name">${escape(shortName(cases[0]))}</span>${escape(t.readThisSub)}`)}
${pauseItem('a', `href="${modeHref(L, 'story')}"`, t.switchStory, escape(t.switchStorySub))}
${pauseItem('a', `href="${modeHref(L, 'multiplayer')}"`, t.modes.multiplayer.name, escape(t.modes.multiplayer.desc))}
${pauseItem('a', `href="${prefix}/"`, t.titleScreen)}
          </ul>
          <div class="pause-tools">
            <nav class="pause-langs" aria-label="${escape(t.langLabel)}">${langs.join(' <span aria-hidden="true">·</span> ')}</nav>
            <button class="link sound-toggle" type="button" data-action="sound" aria-pressed="false"><span>${escape(t.sound)}<span aria-hidden="true">:</span></span> <span class="state" aria-hidden="true">${escape(t.game.off)}</span></button>
            <button class="link motion-toggle" type="button" data-action="motion" aria-pressed="false"><span>${escape(t.reduceMotion)}<span aria-hidden="true">:</span></span> <span class="state" aria-hidden="true">${escape(t.game.off)}</span></button>
          </div>
        </dialog>
      </section>`;
}

// --- The title screen (F4) ----------------------------------------------------------
// `/` opens like a video game, but nothing is locked: name, role, dates, CV and the three projects are all on it.
// The menu is three real links (Story mode, Gameplay, Multiplayer). src/title.js only adds ↑ ↓ inside the menu.
// Background: the night sky and the darkened ballpark (public/game/night.png from F6, field.png before), decoration only.
function titlePage(L, cases) {
  const { t, p } = L;
  const [role, when] = t.titleRole;
  // ids for the old /#about, /#how, /#contact links when JS is off (see OLD_HASHES): they land on the right menu item.
  const ids = { story: ['how', 'about'], play: ['field', 'home'], multiplayer: ['contact'] };
  const menu = MODES.map((mode, i) => `            <li id="${ids[mode][0]}"><a class="menu-item"${ids[mode][1] ? ` id="${ids[mode][1]}"` : ''} href="${modeHref(L, mode)}"${i === 0 ? ' data-first' : ''}><span class="menu-name">${escape(t.modes[mode].name)}</span> <span class="menu-desc">${escape(t.modes[mode].desc)}</span></a></li>`);
  const picks = cases.map(({ data }, i) => `          <li id="${data.slug}">
            <a class="pick" href="${p}/${data.slug}/">
              <span class="pick-no" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
              <span class="pick-body">
                <span class="pick-name">${escape(shortName({ data }))}</span>
                <span class="pick-line">${escape(subtitle({ data }))}</span>
                ${data.stats ? `<span class="pick-stats">${escape(data.stats)}</span>` : ''}
              </span>
            </a>
          </li>`);
  return `      <div class="title-screen">
        <img class="title-stadium" src="${NIGHT}" alt="" width="${FIELD.width}" height="${FIELD.height}" decoding="async">
        <div class="wrap wide title-grid">
          <section class="title-hero" aria-labelledby="name">
            <h1 id="name" class="logo"><span>Riccardo</span> <span>Cirillo</span></h1>
            <p class="role"><strong>${escape(role)}</strong> <span class="sep" aria-hidden="true">·</span> <span class="when">${escape(when)}</span></p>
            <p class="role-sub">${escape(t.titleSub)}</p>
            <nav class="title-menu" aria-label="${escape(t.chooseMode)}">
              <ul>
${menu.join('\n')}
              </ul>
            </nav>
            <p class="menu-hint" hidden>${t.menuHint}</p>
          </section>
          <section class="quick-picks" id="work" aria-labelledby="picks-title">
            <h2 id="picks-title">${escape(t.quickPicks)}</h2>
            <ol class="picks">
${picks.join('\n')}
            </ol>
          </section>
        </div>
      </div>`;
}
// The picture behind the title screen: the night stadium when F6 has drawn it, the day field until then.
const NIGHT = existsSync(root('public/game/night.png')) ? '/game/night.png' : '/game/field.png';

// --- Story mode, chapter 0 (F4) ------------------------------------------------------
// Who I am (the bio of content/about.md), the motto, How I design in three short points, then Chapter 1.
function storyPage(L, about, aboutParts, cases) {
  const { t } = L;
  const principles = aboutParts.find((part) => part.includes('id="how-i-design"')).match(/<ol>[\s\S]*<\/ol>/)[0];
  const hello = about.body.match(/^## (.*?)\s*\{#hi-im-riccardo\}/m)?.[1];
  return `      <article class="story-zero chapter wrap wide">
        ${progress(L, 0)}
        <header class="chapter-head">
          <span class="chapter-no" aria-hidden="true">00</span>
          <h1 id="story-title">${escape(hello)}</h1>
        </header>
        <div class="story-grid">
          <div class="story-bio">
            ${aboutSection(aboutParts, 'hi-im-riccardo')}
            <p class="motto">"${escape(about.data.motto)}"</p>
          </div>
          <section class="story-how" aria-labelledby="how-i-design">
            <h2 id="how-i-design">${escape(t.howTitle)}</h2>
            ${principles}
          </section>
        </div>
        ${chapterNav(L, cases[0], 0)}
      </article>`;
}

// --- Multiplayer (F4) ------------------------------------------------------------------
// Contact & CV: a ticket with the email (real text, clickable) and the two CVs, and a "scouting report" with the facts of
// content/facts.md (no new data; no LinkedIn until there is a URL). The portrait is the batter of the game.
function multiplayerPage(L, f) {
  const { t } = L;
  const [position, city, dates] = t.headline.split(' · ');
  const rows = [
    [t.scout.position, escape(position)],
    [t.scout.available, `${escape(city)}, ${escape(dates)} · ${escape(f.thesis)}`],
    [t.scout.status, f.status.map(escape).join(' · ')],
    [t.scout.languages, f.languages.map(escape).join(' · ')],
    [t.scout.education, `<ul>${f.schools.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>`],
  ];
  return `      <div class="multiplayer wrap wide">
        <header class="mp-head">
          <h1 id="mp-title">${escape(t.modes.multiplayer.name)}</h1>
          <p class="mp-sub">${escape(t.mpSub)}</p>
        </header>
        <div class="mp-grid">
          <section class="ticket" aria-labelledby="ticket-title">
            <div class="ticket-main">
              <h2 id="ticket-title" class="kicker">${escape(t.admitOne)}</h2>
              <p class="ticket-email"><a href="mailto:${EMAIL}">${EMAIL}</a></p>
              <ul class="actions">
                ${cvOrder(L).map((lang, i) => `<li>${cvLink(L, lang, CV[lang].button, i ? 'button ghost' : 'button')}</li>`).join('\n                ')}
              </ul>
            </div>
            <div class="ticket-stub" aria-hidden="true"><span>2027</span></div>
          </section>
          <section class="scouting" data-theme="night" aria-labelledby="scout-title">
            <div class="scout-head">
              <div class="scout-portrait" aria-hidden="true"><span class="batter"></span></div>
              <div>
                <p class="kicker">${escape(t.scoutingReport)}</p>
                <h2 id="scout-title">Riccardo Cirillo</h2>
              </div>
            </div>
            <dl class="scout-rows">
${rows.map(([k, v]) => `              <div><dt>${escape(k)}</dt><dd>${v}</dd></div>`).join('\n')}
            </dl>
          </section>
        </div>
      </div>`;
}


// --- 404 (before publishing) ------------------------------------------------------------
// "Lost ball": the night ballpark of the title screen and the three ways back. Absolute links, so it works at any address.
function notFoundPage(L, og) {
  const { t } = L;
  const main = `      <div class="title-screen lost">
        <img class="title-stadium" src="${NIGHT}" alt="" width="${FIELD.width}" height="${FIELD.height}" decoding="async">
        <div class="wrap wide lost-body">
          <p class="kicker">404</p>
          <h1 class="logo">${escape(t.lostBall)}</h1>
          <p class="role">${escape(t.lostText)}</p>
          <ul class="lost-links">
            <li><a class="menu-item" href="/"><span class="menu-name">${escape(t.titleScreen)}</span></a></li>
            <li><a class="menu-item" href="/story/"><span class="menu-name">${escape(t.modes.story.name)}</span> <span class="menu-desc">${escape(t.modes.story.desc)}</span></a></li>
            <li><a class="menu-item" href="/multiplayer/"><span class="menu-name">${escape(t.modes.multiplayer.name)}</span> <span class="menu-desc">${escape(t.modes.multiplayer.desc)}</span></a></li>
          </ul>
        </div>
      </div>`;
  return layout(L, {
    title: `${t.lostBall} · Riccardo Cirillo`, description: t.lostText, key: '/', image: og, imageAlt: t.homeImageAlt,
    main, theme: 'night', bodyClass: 'title-page', index: false,
  });
}

export async function generate() {
  // Start from an empty public/og: a preview of a case that left the site (Housing, Lab) must not be published.
  await rm(root('public/og'), { recursive: true, force: true });
  await copyFonts();
  for (const lang of LANGS) {
    const L = context(lang);
    const { t } = L;
    const dir = dirOf(lang);
    const load = async (slug) => parse(await readFile(root(`content/${dir}${slug}.md`), 'utf8'));
    const cases = await Promise.all(CASES.map(load));
    const about = await load('about');
    const aboutParts = sections(await markdown(about.body, t)).split(/(?=<section)/);
    const f = await factPieces(L);
    const og = await ogHome(L);
    const page = async (key, html) => {
      await mkdir(root(`${dir}${key}`), { recursive: true });
      await writeFile(root(`${dir}${key}index.html`), html);
    };
    const shared = { image: og, imageAlt: t.homeImageAlt };

    await page('', layout(L, {
      ...shared, title: t.homeTitle, description: t.homeDescription, key: '/', main: titlePage(L, cases),
      theme: 'night', bodyClass: 'title-page', head: titleScript(L), scripts: '<script type="module" src="/src/title.js"></script>',
    }));
    await page('story/', layout(L, {
      ...shared, title: t.meta.story[0], description: t.meta.story[1], key: '/story/', main: storyPage(L, about, aboutParts, cases), mode: 'story',
    }));
    await page('play/', layout(L, {
      ...shared, title: t.meta.play[0], description: t.meta.play[1], key: '/play/', theme: 'night', mode: 'play', bodyClass: 'play-page',
      main: await ballpark(L, cases),
      // The sprites are CSS backgrounds (found late by the browser): preload them so the batter and the field show at once.
      scripts: [
        '<link rel="preload" as="image" href="/game/runner.png">',
        '<link rel="preload" as="image" href="/game/crew.png">',
        '<script type="module" src="/src/game.js"></script>',
      ].join('\n    '),
    }));
    await page('multiplayer/', layout(L, {
      ...shared, title: t.meta.multiplayer[0], description: t.meta.multiplayer[1], key: '/multiplayer/', main: multiplayerPage(L, f), mode: 'multiplayer',
    }));
    for (const [i, c] of cases.entries()) await page(`${c.data.slug}/`, await casePage(L, c, i, cases));
  }
  await writeFile(root('404.html'), notFoundPage(context('en'), await ogHome(context('en'))));
  console.log(`✓ pages generated: ${PAGES.join(', ')}`);
}

// Run directly: node scripts/pages.js
if (process.argv[1] === fileURLToPath(import.meta.url)) await generate();
