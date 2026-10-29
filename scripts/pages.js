// Page generator: turns content/*.md into real static HTML pages, in three languages (Fase 3).
//   content/<case>.md → <case>/index.html  (e.g. /nipotyno/)          English, the default
//   content/es/<case>.md → es/<case>/index.html  (/es/nipotyno/)       Spanish; the same for Italian (it/)
//   home (index.html, es/index.html, it/index.html) is built from the cases' frontmatter + about.md
// Interface strings: src/i18n.js.
// Generated files are in .gitignore: edit content/*.md, never the generated HTML.
// Runs automatically from vite.config.js (dev and build). Manual run: npm run pages
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import sharp from 'sharp';
import { FIELD, STOPS, SPOTS, CREW, CREW_ROWS } from '../src/field-map.js';
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
// Pages Vite must build: home + one per case, for every language.
export const PAGES = LANGS.flatMap((lang) => [`${dirOf(lang)}index.html`, ...CASES.map((slug) => `${dirOf(lang)}${slug}/index.html`)]);

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

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
    .extract({ left: 6 * 48, top: 0, width: 48, height: 48 }) // swing stance, Researcher uniform
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
    spots: SPOTS.map(point),
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
  en: { href: '/cv/CV_Riccardo_Cirillo_EN.pdf', short: 'English', button: 'CV (English, PDF)', lobby: 'Download CV (English, PDF)', done: 'CV (English, PDF)' },
  es: { href: '/cv/CV_Riccardo_Cirillo_ES.pdf', short: 'Español', button: 'CV en español (PDF)', lobby: 'CV en español (PDF)', done: 'CV en español' },
};
const cvOrder = (L) => (CV_LANG[L.lang] === 'es' ? ['es', 'en'] : ['en', 'es']);
const cvLink = (L, lang, text, cls) => `<a${cls ? ` class="${cls}"` : ''} href="${CV[lang].href}"${langAttr(L, lang)}>${text}</a>`;

// EN · ES · IT in the header, like a scoreboard: each one leads to the same page in that language.
// The choice is remembered (a click saves it); only "/" sends a visitor who chose ES or IT to their language.
function langSwitch(L, key) {
  const items = LANGS.map((lang) => {
    const current = lang === L.lang ? ' aria-current="page"' : '';
    return `<li><a href="${PREFIX[lang]}${key}" hreflang="${lang}" lang="${lang}" data-lang="${lang}"${key === '/' ? ' data-home' : ''}${current}>${lang.toUpperCase()}<span class="visually-hidden"> ${LANG_NAMES[lang]}</span></a></li>`;
  });
  return `<nav class="lang-switch" aria-label="${escape(L.t.langLabel)}">
          <ul>${items.join('')}</ul>
        </nav>`;
}
// Saves the choice on click; on the home pages the #anchor (a base) goes along to the other language.
const LANG_SCRIPT = `<script>for (const a of document.querySelectorAll('[data-lang]')) a.addEventListener('click', () => { try { localStorage.setItem('lang', a.dataset.lang); } catch {} if (a.hasAttribute('data-home')) a.hash = location.hash; });</script>`;
// Only on "/": a visitor who CHOSE Spanish or Italian before goes there (never guessed from the browser's language).
const REDIRECT_SCRIPT = `<script>try { const l = localStorage.getItem('lang'); if (l === 'es' || l === 'it') location.replace('/' + l + '/' + location.hash); } catch {}</script>`;

// key = the page's address without the language prefix ('/' or '/nipotyno/').
function layout(L, { title, description, key, image, imageAlt, main, bodyClass = '', scripts = '' }) {
  const { t } = L;
  const url = `${SITE}${L.p}${key}`;
  const cvHeader = CV_LANG[L.lang];
  const alternates = [
    ...LANGS.map((lang) => `<link rel="alternate" hreflang="${lang}" href="${SITE}${PREFIX[lang]}${key}">`),
    `<link rel="alternate" hreflang="x-default" href="${SITE}${key}">`,
  ];
  return `<!doctype html>
<html lang="${L.lang}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${L.lang === 'en' && key === '/' ? REDIRECT_SCRIPT : ''}
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}">
    <link rel="canonical" href="${url}">
    ${alternates.join('\n    ')}
    <meta property="og:locale" content="${LOCALE[L.lang]}">
    ${LANGS.filter((lang) => lang !== L.lang).map((lang) => `<meta property="og:locale:alternate" content="${LOCALE[lang]}">`).join('\n    ')}
    <meta property="og:type" content="${key === '/' ? 'website' : 'article'}">
    <meta property="og:site_name" content="Riccardo Cirillo — UX Research &amp; Design">
    <meta property="og:title" content="${escape(title)}">
    <meta property="og:description" content="${escape(description)}">
    <meta property="og:url" content="${url}">
    <meta property="og:image" content="${SITE}${image}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${escape(imageAlt)}">
    <meta name="twitter:card" content="summary_large_image">
    <link rel="stylesheet" href="/src/style.css">
    ${scripts}
  </head>
  <body${bodyClass ? ` class="${bodyClass}"` : ''}>
    <a class="skip" href="#main">${escape(t.skip)}</a>
    <header class="site-header">
      <div class="wrap">
        <a class="brand" href="${L.p}/">Riccardo Cirillo</a>
        <nav aria-label="${escape(t.navLabel)}">
          <ul>
            <li><a href="${L.p}/#work">${escape(t.work)}</a></li>
            <li><a href="${L.p}/#about">${escape(t.about)}</a></li>
            <li>${cvLink(L, cvHeader, `CV <abbr title="${CV[cvHeader].short}">${cvHeader.toUpperCase()}</abbr>`)}</li>
            <li><a href="mailto:${EMAIL}">${escape(t.email)}</a></li>
          </ul>
        </nav>
        ${langSwitch(L, key)}
      </div>
    </header>
    <main id="main" tabindex="-1">
${main}
    </main>
    <footer class="site-footer">
      <div class="wrap">
        <p><strong>Riccardo Cirillo</strong> · ${escape(t.headline)}</p>
        <p><a href="mailto:${EMAIL}">${EMAIL}</a> · CV: ${cvLink(L, 'en', CV.en.short)} · ${cvLink(L, 'es', CV.es.short)}</p>
      </div>
    </footer>
    ${LANG_SCRIPT}
  </body>
</html>
`;
}

// One small line a recruiter in Madrid looks for first: work status, languages, what he is after.
// It comes from the "Status" and "Languages" lines of content/facts.md (single source of truth); the build stops if they change shape.
// "EU citizen with Spanish NIE · Available…" → "EU citizen · Spanish NIE"; "English (B2 – IELTS…)" → "English B2".
// In ES and IT each piece goes through L.tr (src/i18n.js), so a new fact without its translation stops the build too.
async function statusLine(L) {
  const facts = await readFile(root('content/facts.md'), 'utf8');
  const field = (name) => facts.match(new RegExp(`^- ${name}: (.+)$`, 'm'))?.[1];
  const status = field('Status')?.split(' · ')[0].split(' with ');
  const languages = field('Languages')?.split(' · ').map((l) => l.replace(/^(\w+) \((B[12]|C[12])\b[^)]*\)$/, '$1 $2'));
  if (status?.length !== 2 || !languages?.length) throw new Error('content/facts.md: the "Status" or "Languages" line is missing or has another shape');
  return [...status, ...languages, "Curricular internship + master's thesis"].map((piece) => L.tr(piece)).join(' · ');
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

async function casePage(L, c, i, all) {
  const { data } = c;
  const { t, p } = L;
  let html = figures(await markdown(c.body, t));
  html = sections(html);
  html = html.replace('<section id="tl-dr">', '<section id="tl-dr" class="tldr">'); // styled by class: the reader prefixes the ids

  const prev = all[i - 1];
  const next = all[i + 1];
  const pager = `<nav class="pager" aria-label="${escape(t.otherCases)}">
  ${prev ? `<a rel="prev" href="${p}/${prev.data.slug}/"><span>← ${escape(t.previous)} · ${escape(prev.data.base)}</span>${escape(shortName(prev))}</a>` : '<span></span>'}
  ${next ? `<a rel="next" href="${p}/${next.data.slug}/"><span>${escape(t.next)} · ${escape(next.data.base)} →</span>${escape(shortName(next))}</a>` : `<a href="${p}/#work"><span>${escape(t.backTo)} →</span>${escape(t.allCases)}</a>`}
</nav>`;

  const stop = L.stop(data.slug);
  // A pixel band on top (outside the article, so the case reader in the stadium does not show it twice).
  const band = `      <div class="case-band">
        <div class="wrap band-row">
          <span class="base-icon" style="--icon: ${iconOf(stop)}" aria-hidden="true"></span>
          <span class="band-name" aria-hidden="true">${pixelText(shortName(c), { color: PALETTE.white, shadow: PALETTE.red })}</span>
          <a class="band-back" href="${p}/#${data.slug}"><span aria-hidden="true">◀</span> ${escape(t.backToBallpark)} · ${escape(stop.label)}</a>
        </div>
      </div>`;
  const main = `${band}
      <article class="case wrap">
        <p class="print-head">Riccardo Cirillo · ${escape(t.headline.split(' · ')[0])} · ${EMAIL} · ${SITE.replace('https://', '')}${p}/${data.slug}/</p>
        <p class="crumb"><a href="${p}/#work">${escape(t.allCases)}</a> · <a href="/pdf/${pdfName(data.slug, L.lang)}">${escape(t.downloadPdf)}<span class="visually-hidden">${escape(t.ofThisCase)}</span></a></p>
        <p class="kicker">${escape(data.base)} · ${escape(shortName(c))}</p>
        <h1 id="case-title" tabindex="-1">${escape(shortName(c))}${subtitle(c) ? `<span class="sub">${escape(subtitle(c))}</span>` : ''}</h1>
        ${facts(L, data)}
        ${html}
        ${pager}
      </article>`;

  return layout(L, {
    title: `${shortName(c)} — ${subtitle(c) || 'Riccardo Cirillo'} · Riccardo Cirillo`,
    description: data.description,
    key: `/${data.slug}/`,
    image: await ogCase(L, data.slug, data.og_image),
    imageAlt: `${shortName(c)} — ${t.caseBy} (${stop.label})`,
    main,
  });
}

// The ballpark: pixel field + every point as a real link + one card per point.
// Without JavaScript the points are plain links (case pages, #about, #how, #contact) and the home card is shown under the
// field; src/game.js adds the game: batting, the tour, free running, cards over the stadium; src/reader.js the case reader.
// Under 1000 px the field is at 1× with icon-only labels and the "Stadium map" list under it (see style.css).
const POINTS = [...STOPS.map((p) => ({ ...p, spot: false })), ...SPOTS.map((p) => ({ ...p, spot: true }))];
const pointsOf = (L) => [...L.stops.map((p) => ({ ...p, spot: false })), ...L.spots.map((p) => ({ ...p, spot: true }))];
const pointHref = (L, p) => (p.spot ? p.href : (p.id === 'home' ? '#field-panel' : `${L.p}/${p.id}/`));
const pointData = (p) => (p.spot ? `data-spot="${p.id}"` : `data-stop="${p.id}"`);
const iconOf = (p) => POINTS.findIndex((q) => q.id === p.id);

// The content of one "## Heading" section of content/about.md, without its heading and without its id (no duplicate ids).
function aboutSection(aboutParts, id) {
  const part = aboutParts.find((p) => p.startsWith(`<section id="${id}"`));
  if (!part) throw new Error(`content/about.md: section "${id}" not found`);
  return part.replace(/^<section[^>]*>\s*<h2>[\s\S]*?<\/h2>\s*/, '').replace(/\s*<\/section>\s*$/, '');
}

const cvLinks = (L) => `<ul class="actions">
              <li><a class="button" href="mailto:${EMAIL}">${EMAIL}</a></li>
              ${cvOrder(L).map((lang) => `<li>${cvLink(L, lang, CV[lang].button, 'button ghost')}</li>`).join('\n              ')}
            </ul>`;

async function ballpark(L, cases, { aboutParts, how, status }) {
  const { t, p: prefix } = L;
  const bySlug = Object.fromEntries(cases.map((c) => [c.data.slug, c]));
  const pct = (value, total) => `${+((value / total) * 100).toFixed(3)}%`;
  const facts = await readFile(root('content/facts.md'), 'utf8');
  const schools = [facts.match(/^- Education: (.+)$/m)?.[1], ...[...facts.matchAll(/^ {2}- (.+)$/gm)].map((m) => m[1])].filter(Boolean).map((s) => L.tr(s));
  if (schools.length < 4) throw new Error('content/facts.md: the Education lines are missing');

  const all = pointsOf(L);
  const point = (id) => all.find((q) => q.id === id);
  const points = all.map((p) => `                  <li><a class="base${p.spot ? ' spot' : ''}" href="${pointHref(L, p)}" ${pointData(p)} data-tag="${p.tag}" style="--x: ${pct(p.x, FIELD.width)}; --y: ${pct(p.y, FIELD.height)}; --icon: ${iconOf(p)}"><span class="base-icon"></span><span class="base-text"><span class="base-label">${escape(p.label)}</span> <span class="base-name">${escape(p.name)}</span></span></a></li>`);
  const legend = all.map((p) => `          <li><a href="${pointHref(L, p)}" ${pointData(p)}><span class="base-icon" style="--icon: ${iconOf(p)}" aria-hidden="true"></span> <span class="map-name">${escape(p.name)}</span> <span class="map-label">${escape(p.label)}</span></a></li>`);
  // Crew sprites (coaches, teammates, pitcher): decoration only, so hidden from screen readers.
  const crew = CREW.map((m) => `                  <div class="sprite crew-sprite${m.flip ? ' is-flipped' : ''}" data-crew="${m.id}" style="--x: ${pct(m.x, FIELD.width)}; --y: ${pct(m.y, FIELD.height)}; --row: ${CREW_ROWS.indexOf(m.who)}"></div>`);
  const covers = Object.fromEntries(await Promise.all(cases.map(async ({ data }) => [data.slug, { src: data.cover, ...(await imageSize(data.cover)) }])));
  const nipotyno = bySlug.nipotyno;

  const kicker = (id) => `${escape(point(id).label)} · ${escape(point(id).name)}`;
  const panels = [
    `          <article class="panel-card" data-panel="home">
            <p class="kicker">${kicker('home')}</p>
            <h3>${escape(t.homeCardTitle)}</h3>
            <p>${t.homeCardText}</p>
            <p><a class="button" href="${prefix}/nipotyno/" data-read>${escape(fill(t.readNamed, { name: shortName(nipotyno) }))}</a></p>
            <p class="small">${escape(nipotyno.data.description)}</p>
          </article>`,
    ...cases.map(({ data }) => {
      const cover = covers[data.slug];
      const numbers = data.stats ? `<ul class="key-numbers" aria-label="${escape(t.keyNumbers)}">${data.stats.split(' · ').map((n) => `<li>${escape(n)}</li>`).join('')}</ul>` : '';
      return `          <article class="panel-card" data-panel="${data.slug}" hidden>
            <img class="panel-cover" src="${cover.src}" alt="" width="${cover.width}" height="${cover.height}" loading="lazy" decoding="async">
            <p class="kicker">${kicker(data.slug)}</p>
            <h3>${escape(shortName({ data }))}<span class="sub">${escape(subtitle({ data }))}</span></h3>
            ${numbers}
            <p class="card-links"><a class="button" href="${prefix}/${data.slug}/" data-read>${escape(t.read)}<span class="visually-hidden">: ${escape(shortName({ data }))}</span> →</a> <a class="pdf-link" href="/pdf/${pdfName(data.slug, L.lang)}">PDF<span class="visually-hidden">${escape(t.of)}${escape(shortName({ data }))}</span></a></p>
            <p>${escape(data.tldr)}</p>
            ${data.role ? `<p class="small"><strong>${escape(t.roleLabel)}</strong> ${escape(data.role)}</p>` : ''}
          </article>`;
    }),
    `          <article class="panel-card" data-panel="done" hidden>
            <p class="kicker">${escape(t.tourDoneKicker)}</p>
            <h3>${escape(t.tourDoneTitle)}</h3>
            <p>${escape(t.tourDoneText)}</p>
            <ul class="actions">
              ${cvOrder(L).map((lang, i) => `<li>${cvLink(L, lang, CV[lang].done, i ? 'button ghost' : 'button')}</li>`).join('\n              ')}
              <li><a class="button ghost" href="mailto:${EMAIL}">${escape(t.emailMe)}</a></li>
            </ul>
            <p><button class="button ghost" type="button" data-action="again">${escape(t.again)}</button></p>
          </article>`,
    `          <article class="panel-card" data-panel="about" hidden>
            <p class="kicker">${kicker('about')}</p>
            <h3>${escape(t.playerStats)}</h3>
            ${aboutSection(aboutParts, 'hi-im-riccardo')}
            <h4>${escape(t.studies)}</h4>
            <ul class="card-list">${schools.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
            <h4>${escape(t.languagesStatus)}</h4>
            <p>${escape(status)}</p>
            <h4>${escape(t.whyBaseball)}</h4>
            ${aboutSection(aboutParts, 'why-baseball')}
            <h4>${escape(t.toolbox)}</h4>
            ${aboutSection(aboutParts, 'toolbox')}
          </article>`,
    `          <article class="panel-card" data-panel="how" hidden>
            <p class="kicker">${kicker('how')}</p>
            <h3>${escape(t.howTitle)}</h3>
            <h4>${escape(t.principles)}</h4>
            ${how.principles}
            <h4>${escape(t.uniformsTitle)}</h4>
            ${how.uniforms}
            <h4>${escape(t.moodboard)}</h4>
            ${how.moodboard}
          </article>`,
    `          <article class="panel-card" data-panel="contact" hidden>
            <p class="kicker">${kicker('contact')}</p>
            <h3>${escape(t.contact)}</h3>
            <p>${escape(t.headline)}</p>
            <p class="small">${escape(status)}</p>
            ${cvLinks(L)}
          </article>`,
  ];

  // data-strings: the few sentences of the game's JavaScript, in the page's language (src/game.js reads them).
  return `      <section id="field" class="field" aria-labelledby="field-title" data-strings="${escape(JSON.stringify(t.game))}">
        <div class="field-head wrap wide">
          <h2 id="field-title">${escape(t.fieldTitle)}</h2>
          <p class="hint">${escape(t.fieldHint)} <a href="#work">${escape(t.preferList)}</a></p>
        </div>
        <div class="ballpark">
          <div class="stage-col">
            <div class="stage">
              <div class="field-box">
                <div class="world">
                  <img class="field-img" src="/game/field.png" alt="${escape(t.fieldAlt)}" width="${FIELD.width}" height="${FIELD.height}">
${crew.join('\n')}
                  <div class="sprite runner" style="--x: ${pct(STOPS[0].x, FIELD.width)}; --y: ${pct(STOPS[0].y, FIELD.height)}"></div>
                  <div class="ball" hidden></div>
                </div>
                <ul class="bases" aria-label="${escape(t.stadium)}">
${points.join('\n')}
                </ul>
              </div>
              <div class="swing-box" hidden><button class="button swing" type="button" data-action="swing"><span aria-hidden="true">⚾</span> ${escape(t.swing)}</button></div>
              <p class="banner" aria-hidden="true" hidden>${escape(t.homeRun)}</p>
              <div class="tour-map" aria-hidden="true" hidden>
                <span class="tour-diamond"><i data-corner="second"></i><i data-corner="third"></i><i data-corner="first"></i><i data-corner="home"></i></span>
                <span class="tour-count"></span>
              </div>
            </div>
            <div class="game-bar" hidden>
              <div class="bar-row" data-mode="bat">
                <p class="bar-hint"><strong>${escape(t.orClick)}</strong><span class="no-touch"> ${t.pressSpace}</span></p>
              </div>
              <div class="bar-row" data-mode="tour" hidden>
                <button class="link" type="button" data-action="free"><span aria-hidden="true">✕</span> ${escape(t.exitTour)}</button>
              </div>
              <div class="bar-row" data-mode="free" hidden>
                <button class="button ghost" type="button" data-action="again">${escape(t.again)}</button>
                <p class="bar-hint">${t.freeHint}</p>
              </div>
              <p class="bar-tools"><button class="link sound-toggle" type="button" data-action="sound" aria-pressed="false"><span aria-hidden="true">♪</span> ${escape(t.sound)} <span class="state" aria-hidden="true">${escape(t.game.off)}</span></button></p>
              <p class="visually-hidden" role="status"></p>
            </div>
          </div>
          <div class="panel" id="field-panel" tabindex="-1" role="region" aria-label="${escape(t.card)}">
            <button class="panel-close" type="button" data-action="close" hidden><span aria-hidden="true">✕</span> ${escape(t.close)}</button>
${panels.join('\n')}
          </div>
        </div>
        <nav class="stadium-map wrap wide" aria-labelledby="map-title">
          <h3 id="map-title">${escape(t.stadiumMap)}</h3>
          <ul>
${legend.join('\n')}
          </ul>
        </nav>
      </section>`;
}

// "How I design": principles (content/about.md), the three uniforms and their skills, the moodboard.
// The pieces are used twice: in the section of the page (#how) and in the mound's card in the stadium (without ids).
function howPieces(L, cases, principles) {
  const { t, p } = L;
  const bySlug = Object.fromEntries(cases.map((c) => [c.data.slug, c]));
  const uniformCards = L.uniforms.map((u) => {
    const c = bySlug[u.suggested];
    return `            <div class="uniform-card" data-uniform="${u.id}">
              <h3>${escape(t.yourUniform)}: ${escape(u.label)}</h3>
              <ul class="skills">${u.skills.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
              <p>${escape(t.suggestedCase)}: <a href="${p}/${c.data.slug}/">${escape(shortName(c))} — ${escape(subtitle(c))}</a></p>
            </div>`;
  });
  const uniforms = `<ul class="uniform-list">${L.uniforms.map((u) => {
    const c = bySlug[u.suggested];
    return `<li><strong>${escape(u.label)}</strong> <span class="skills-inline">${u.skills.map(escape).join(' · ')}</span> <span class="small">${escape(t.suggestedFirstBase)}: <a href="${p}/${c.data.slug}/" data-read>${escape(shortName(c))}</a></span></li>`;
  }).join('')}</ul>`;
  const swatches = ['navy', 'red', 'sky', 'grass', 'dirt', 'yellow'].map(
    (name) => `<li><span class="swatch" style="background: ${PALETTE[name]}"></span>${escape(t.colours[name])} <code>${PALETTE[name]}</code></li>`,
  );
  const moodboard = `<ul class="swatches" aria-label="${escape(t.palette)}">${swatches.join('')}</ul>
            <p>${t.type}</p>
            <p>${fill(t.mood, { link: `<a href="https://ponywolf.com/retro-pixel-baseball"${langAttr(L, 'en')}>Retro Pixel Baseball by Ponywolf</a>` })}</p>`;
  return { principles, uniformCards: uniformCards.join('\n'), uniforms, moodboard };
}

function howIDesign(L, how) {
  const { t } = L;
  return `      <section id="how" class="how wrap wide" aria-labelledby="how-title">
        <h2 id="how-title">${escape(t.howTitle)}</h2>
        <div class="how-grid">
          <div class="how-block">
            <h3>${escape(t.principles)}</h3>
            ${how.principles}
          </div>
          <div class="how-block">
${how.uniformCards}
          </div>
          <div class="how-block moodboard">
            <h3>${escape(t.moodboard)}</h3>
            ${how.moodboard}
          </div>
        </div>
      </section>`;
}

// Lobby (first screen, not a gate): "Select your player" on one side, the player card (a short About) on the other.
// Everything a recruiter needs is visible at once: name, role, Madrid and dates, status, CV EN/ES, email, Nipotyno.
// The uniform switch is plain CSS (radio + :has() in style.css); src/uniform.js remembers it and adds ◀ ▶ on phones.
// Numbers on the card come from content/facts.md and content/about.md, so they can never disagree with the CV.
async function cardStats(L) {
  const facts = await readFile(root('content/facts.md'), 'utf8');
  const languages = facts.match(/^- Languages: (.+)$/m)?.[1].split(' · ').length;
  const sus = facts.match(/SUS ([\d.]+)/)?.[1];
  if (!languages || !sus) throw new Error('content/facts.md: Languages or the SUS score is missing');
  const [countries, langs, susLabel] = L.t.stats;
  return [['3', countries], [String(languages), langs], [L.lang === 'en' ? sus : sus.replace('.', ','), susLabel]]; // 78,75 in ES and IT
}

function startScreen(L, cases, about, status, stats) {
  const { t, p } = L;
  const nipotyno = cases.find((c) => c.data.slug === 'nipotyno');
  const bio = about.body.match(/^## .*\{#hi-im-riccardo\}\n([^\n]+)/m)?.[1];
  if (!bio) throw new Error(`content/${dirOf(L.lang)}about.md: the {#hi-im-riccardo} paragraph is missing`);
  const suggested = (u) => L.stop(u.suggested).name;
  const tiles = L.uniforms.map((u, i) => `            <label class="uniform-tile" style="--row: ${u.row}">
              <input type="radio" name="uniform" id="u-${u.id}" value="${u.id}"${i === 0 ? ' checked' : ''} aria-labelledby="u-${u.id}-name" aria-describedby="u-${u.id}-desc">
              <span class="portrait" aria-hidden="true"></span>
              <span class="tile-name" id="u-${u.id}-name">${escape(u.label)}</span>
              <span class="tile-desc" id="u-${u.id}-desc"><span class="tile-skills">${u.skills.slice(0, 3).map(escape).join(' · ')}</span> <span class="tile-suggest">${escape(t.suggestedFirstBase)}: ${escape(suggested(u))}</span></span>
            </label>`);
  const white = { color: PALETTE.white, shadow: PALETTE.navyDark };
  return `      <section class="hero lobby wrap wide" aria-labelledby="name">
        <div class="player-select">
          <fieldset class="uniforms">
            <legend><span class="pixel-heading" aria-hidden="true">${pixelText(t.selectPlayer, { color: PALETTE.yellow, shadow: PALETTE.red })}</span><span class="visually-hidden">${escape(t.selectPlayer)}</span></legend>
            <div class="player-stage">
              <button class="uniform-step" type="button" data-step="-1" hidden><span aria-hidden="true">◀</span><span class="visually-hidden">${escape(t.previousUniform)}</span></button>
              <div class="batter" aria-hidden="true"></div>
              <button class="uniform-step" type="button" data-step="1" hidden><span aria-hidden="true">▶</span><span class="visually-hidden">${escape(t.nextUniform)}</span></button>
            </div>
            <div class="uniform-tiles">
${tiles.join('\n')}
            </div>
          </fieldset>
        </div>
        <article class="player-card" aria-labelledby="name">
          <header class="card-band">
            <h1 id="name"><span class="pixel-name" aria-hidden="true">${pixelText('Riccardo Cirillo', white)}</span><span class="visually-hidden">Riccardo Cirillo</span></h1>
          </header>
          <div class="card-body">
            <p class="headline">${escape(t.headline)}</p>
            <p class="status-line">${escape(status)}</p>
            <p class="motto">“${escape(about.data.motto)}”</p>
            <ul class="card-stats">${stats.map(([n, label]) => `<li><strong>${escape(n)}</strong> ${escape(label)}</li>`).join('')}</ul>
            <p class="card-bio">${escape(bio)}</p>
            <ul class="actions">
              ${cvOrder(L).map((lang) => `<li>${cvLink(L, lang, L.lang === lang ? CV[lang].lobby : CV[lang].button, 'button ghost')}</li>`).join('\n              ')}
              <li><a class="button ghost" href="mailto:${EMAIL}">${EMAIL}</a></li>
            </ul>
            <a class="start-here" href="${p}/nipotyno/" data-read><span class="kicker">${escape(t.startHere)}</span> <strong>${escape(shortName(nipotyno))} — ${escape(subtitle(nipotyno))} <span aria-hidden="true">→</span></strong></a>
          </div>
        </article>
        <p class="lobby-cta">
          <a class="button enter" href="#field"><span aria-hidden="true">▶</span> ${escape(t.enter)}</a>
          <a class="skip-list" href="#work">${escape(t.skipList)}</a>
        </p>
      </section>`;
}

async function homePage(L, cases, about, status, stats) {
  const { t, p } = L;
  const cards = await Promise.all(
    cases.map(async ({ data }, i) => {
      const { width, height } = await imageSize(data.cover);
      return `<li class="case-card" id="${data.slug}">
  <a href="${p}/${data.slug}/" data-read>
    <img src="${data.cover}" alt="" width="${width}" height="${height}"${i > 1 ? ' loading="lazy"' : ''} decoding="async">
    <span class="kicker">${escape(data.base)} · ${escape(shortName({ data }))}</span>
    <h3>${escape(subtitle({ data }) || shortName({ data }))}</h3>
  </a>
  <p>${escape(data.description)}</p>
</li>`;
    }),
  );

  // About: the motto is already in the hero, the principles in "How I design", contacts in the footer: skip those parts.
  const aboutParts = sections(await markdown(about.body, t)).split(/(?=<section)/);
  const aboutHtml = aboutParts
    .filter((part) => !/id="(i-dont-know|how-i-design|contact)/.test(part))
    .join('\n')
    .replace(/<h2>/g, '<h3>').replace(/<\/h2>/g, '</h3>');
  const principles = aboutParts.find((part) => part.includes('id="how-i-design"')).match(/<ol>[\s\S]*<\/ol>/)[0];

  const how = howPieces(L, cases, principles);
  const main = `${startScreen(L, cases, about, status, stats)}
${await ballpark(L, cases, { aboutParts, how, status })}
${howIDesign(L, how)}
      <section id="work" class="work wrap" aria-labelledby="work-title" tabindex="-1">
        <h2 id="work-title">${escape(t.work)}</h2>
        <ul class="case-list">
${cards.join('\n')}
        </ul>
      </section>
      <section id="about" class="about wrap" aria-labelledby="about-title">
        <h2 id="about-title">${escape(t.aboutMe)}</h2>
        <p class="status-line">${escape(status)}</p>
${aboutHtml}
      </section>
      <section id="contact" class="contact wrap" aria-labelledby="contact-title">
        <h2 id="contact-title">${escape(t.contact)}</h2>
        <p>${escape(t.headline)}</p>
        ${cvLinks(L)}
      </section>`;

  return layout(L, {
    title: t.homeTitle,
    description: t.homeDescription,
    key: '/',
    image: await ogHome(L),
    imageAlt: t.homeImageAlt,
    main,
    bodyClass: 'home',
    // The sprites are CSS backgrounds (found late by the browser): preload them so the batter and the field show at once.
    scripts: [
      '<link rel="preload" as="image" href="/game/runner.png">',
      '<link rel="preload" as="image" href="/game/crew.png">',
      '<script type="module" src="/src/game.js"></script>',
      '<script type="module" src="/src/uniform.js"></script>',
    ].join('\n    '),
  });
}

export async function generate() {
  // Start from an empty public/og: a preview of a case that left the site (Housing, Lab) must not be published.
  await rm(root('public/og'), { recursive: true, force: true });
  for (const lang of LANGS) {
    const L = context(lang);
    const dir = dirOf(lang);
    const load = async (slug) => parse(await readFile(root(`content/${dir}${slug}.md`), 'utf8'));
    const cases = await Promise.all(CASES.map(load));
    const about = await load('about');

    if (dir) await mkdir(root(dir), { recursive: true });
    await writeFile(root(`${dir}index.html`), await homePage(L, cases, about, await statusLine(L), await cardStats(L)));
    for (const [i, c] of cases.entries()) {
      await mkdir(root(`${dir}${c.data.slug}`), { recursive: true });
      await writeFile(root(`${dir}${c.data.slug}/index.html`), await casePage(L, c, i, cases));
    }
  }
  console.log(`✓ pages generated: ${PAGES.join(', ')}`);
}

// Run directly: node scripts/pages.js
if (process.argv[1] === fileURLToPath(import.meta.url)) await generate();
