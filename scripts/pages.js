// Page generator: turns content/*.md into real static HTML pages.
//   content/<case>.md → <case>/index.html  (e.g. /nipotyno/)
//   home (index.html) is built from the cases' frontmatter + content/about.md
// Generated files are in .gitignore: edit content/*.md, never the generated HTML.
// Runs automatically from vite.config.js (dev and build). Manual run: npm run pages
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';
import sharp from 'sharp';
import { FIELD, STOPS, SPOTS, CREW, CREW_ROWS } from '../src/field-map.js';
import { UNIFORMS } from '../src/uniforms.js';
import { PALETTE } from '../src/palette.js';
import { pixelText } from './art/title.js';

const SITE = 'https://ricccardo15.github.io';
const EMAIL = 'riccardo.cirillo.work@gmail.com';
// Order on the home and on the diamond: 1st, 2nd, 3rd base, dugout.
export const CASES = ['nipotyno', 'levante', 'housing', 'lab'];
// PDF of each case (made after the build by scripts/pdf.js from the page itself, with the print CSS).
export const pdfName = (slug) => `Riccardo_Cirillo_${STOPS.find((s) => s.id === slug).name}.pdf`;
// Pages Vite must build (home + one per case).
export const PAGES = ['index.html', ...CASES.map((slug) => `${slug}/index.html`)];

const root = (path) => fileURLToPath(new URL(`../${path}`, import.meta.url));

// --- Markdown -------------------------------------------------------------

// Frontmatter = the `key: "value"` block between --- lines at the top of each .md file.
function parse(source) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
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
const slugify = (text) => text.toLowerCase().replace(/<[^>]+>|&[#\w]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

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
async function markdown(body) {
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
    .replace(/<table>/g, '<div class="table-wrap" tabindex="0" role="region" aria-label="Results table"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

// Wraps each "## Heading" and the text under it in a <section id="heading">, so every part has a link.
function sections(html, className = '') {
  return html
    .split(/(?=<h2>)/)
    .map((part) => {
      const heading = part.match(/^<h2>(.*?)<\/h2>/);
      if (!heading) return part.trim();
      const cls = className ? ` class="${className}"` : '';
      return `<section id="${slugify(heading[1])}"${cls}>\n${part.trim()}\n</section>`;
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

// Home: the pixel ballpark at 4× (with Riccardo at bat on home plate) under a navy band with the pixel name and role.
async function ogHome() {
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
  return saveOg('home', sharp(field).composite([
    // feet (row 46 of 48) on home plate
    { input: batter, left: home.x * SCALE - CROP.left - 24 * SCALE, top: home.y * SCALE - CROP.top - 46 * SCALE },
    band(190),
    await pixelLayer('Riccardo Cirillo', 7, { color: PALETTE.white, shadow: PALETTE.red }, undefined, 42),
    await pixelLayer('UX Research & Design · Madrid 2027', 3, { color: PALETTE.yellow, shadow: PALETTE.navyDark }, undefined, 128),
  ]));
}

// Case: navy band with the case name in pixels, the cover image below.
async function ogCase(slug, src) {
  const stop = STOPS.find((s) => s.id === slug);
  const cover = await sharp(root(`public${src}`))
    .resize(OG.width, OG.height - 150, { fit: 'contain', background: '#f7f4ec' })
    .flatten({ background: '#f7f4ec' })
    .toBuffer();
  const base = sharp({ create: { ...OG, channels: 3, background: '#f7f4ec' } });
  return saveOg(slug, base.composite([
    band(150),
    await pixelLayer(stop.name, 8, { color: PALETTE.white, shadow: PALETTE.red }, 60, 28),
    await pixelLayer(`${stop.label} · Case study by Riccardo Cirillo`, 2, { color: PALETTE.yellow, shadow: PALETTE.navyDark }, 60, 112),
    { input: cover, left: 0, top: 150 },
  ]));
}

// --- Layout -----------------------------------------------------------------

function layout({ title, description, path, image, imageAlt, main, bodyClass = '', scripts = '' }) {
  const url = `${SITE}${path}`;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}">
    <link rel="canonical" href="${url}">
    <meta property="og:type" content="${path === '/' ? 'website' : 'article'}">
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
    <a class="skip" href="#main">Skip to content</a>
    <header class="site-header">
      <div class="wrap">
        <a class="brand" href="/">Riccardo Cirillo</a>
        <nav aria-label="Main">
          <ul>
            <li><a href="/#work">Case studies</a></li>
            <li><a href="/#about">About</a></li>
            <li><a href="/cv/CV_Riccardo_Cirillo_EN.pdf">CV <abbr title="English">EN</abbr></a></li>
            <li><a href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es" lang="es">CV <abbr title="Español">ES</abbr></a></li>
            <li><a href="mailto:${EMAIL}">Email</a></li>
          </ul>
        </nav>
      </div>
    </header>
    <main id="main" tabindex="-1">
${main}
    </main>
    <footer class="site-footer">
      <div class="wrap">
        <p><strong>Riccardo Cirillo</strong> · UX Research &amp; Design intern · Madrid · Feb–Jul 2027</p>
        <p><a href="mailto:${EMAIL}">${EMAIL}</a> · CV: <a href="/cv/CV_Riccardo_Cirillo_EN.pdf">English</a> · <a href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es" lang="es">Español</a></p>
      </div>
    </footer>
  </body>
</html>
`;
}

// One small line a recruiter in Madrid looks for first: work status, languages, what he is after.
// It comes from the "Status" and "Languages" lines of content/facts.md (single source of truth); the build stops if they change shape.
// "EU citizen with Spanish NIE · Available…" → "EU citizen · Spanish NIE"; "English (B2 – IELTS…)" → "English B2".
async function statusLine() {
  const facts = await readFile(root('content/facts.md'), 'utf8');
  const field = (name) => facts.match(new RegExp(`^- ${name}: (.+)$`, 'm'))?.[1];
  const status = field('Status')?.split(' · ')[0].replace(' with ', ' · ');
  const languages = field('Languages')?.split(' · ').map((l) => l.replace(/^(\w+) \((B[12]|C[12])\b[^)]*\)$/, '$1 $2'));
  if (!status || !languages?.length) throw new Error('content/facts.md: the "Status" or "Languages" line is missing or has another shape');
  return [status, ...languages, "Curricular internship + master's thesis"].join(' · ');
}

const shortName = (c) => c.data.title.split(' — ')[0];
const subtitle = (c) => c.data.title.split(' — ').slice(1).join(' — ');

function facts(data) {
  const rows = [
    ['My role', data.role],
    ['Team', data.team],
    ['Context', data.context],
    ['When', data.duration],
    ['Methods & tools', data.tools],
  ].filter(([, value]) => value);
  return `<dl class="facts">\n${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${escape(v)}</dd></div>`).join('\n')}\n</dl>`;
}

async function casePage(c, i, all) {
  const { data } = c;
  const isLab = data.slug === 'lab';
  let html = figures(await markdown(c.body));
  html = sections(html, isLab ? 'card' : '');
  html = html.replace('<section id="tl-dr">', '<section id="tl-dr" class="tldr">'); // styled by class: the reader prefixes the ids
  // Lab cards: picture on top, then title and the two lines of text.
  if (isLab) {
    html = html.replace(/(class="card">\n)(<h2>[\s\S]*?)(<img [^>]+>)/g, '$1<figure>$3</figure>\n$2');
    html = `<div class="cards">\n${html}\n</div>`;
  }

  const prev = all[i - 1];
  const next = all[i + 1];
  const pager = `<nav class="pager" aria-label="Other case studies">
  ${prev ? `<a rel="prev" href="/${prev.data.slug}/"><span>← Previous · ${escape(prev.data.base)}</span>${escape(shortName(prev))}</a>` : '<span></span>'}
  ${next ? `<a rel="next" href="/${next.data.slug}/"><span>Next · ${escape(next.data.base)} →</span>${escape(shortName(next))}</a>` : `<a href="/#work"><span>Back to →</span>All case studies</a>`}
</nav>`;

  const stop = STOPS.find((s) => s.id === data.slug);
  // A pixel band on top (outside the article, so the case reader in the stadium does not show it twice).
  const band = `      <div class="case-band">
        <div class="wrap band-row">
          <span class="base-icon" style="--icon: ${iconOf(stop)}" aria-hidden="true"></span>
          <span class="band-name" aria-hidden="true">${pixelText(shortName(c), { color: PALETTE.white, shadow: PALETTE.red })}</span>
          <a class="band-back" href="/#${data.slug}"><span aria-hidden="true">◀</span> Back to the ballpark · ${escape(stop.label)}</a>
        </div>
      </div>`;
  const main = `${band}
      <article class="case wrap">
        <p class="print-head">Riccardo Cirillo · UX Research &amp; Design intern · ${EMAIL} · ${SITE.replace('https://', '')}/${data.slug}/</p>
        <p class="crumb"><a href="/#work">All case studies</a> · <a href="/pdf/${pdfName(data.slug)}">Download PDF<span class="visually-hidden"> of this case study</span></a></p>
        <p class="kicker">${escape(data.base)} · ${escape(shortName(c))}</p>
        <h1 id="case-title" tabindex="-1">${escape(shortName(c))}${subtitle(c) ? `<span class="sub">${escape(subtitle(c))}</span>` : ''}</h1>
        ${isLab ? `<p class="lede">${escape(data.tldr)}</p>` : facts(data)}
        ${html}
        ${pager}
      </article>`;

  return layout({
    title: `${shortName(c)} — ${subtitle(c) || 'Riccardo Cirillo'} · Riccardo Cirillo`,
    description: data.description,
    path: `/${data.slug}/`,
    image: await ogCase(data.slug, data.og_image),
    imageAlt: `${shortName(c)} — case study by Riccardo Cirillo (${STOPS.find((s) => s.id === data.slug).label})`,
    main,
  });
}

// The ballpark: pixel field + every point as a real link + one card per point.
// Without JavaScript the points are plain links (case pages, #about, #how, #contact) and the home card is shown under the
// field; src/game.js adds the game: batting, the tour, free running, cards over the stadium; src/reader.js the case reader.
// Under 1000 px the field is at 1× with icon-only labels and the "Stadium map" list under it (see style.css).
const POINTS = [...STOPS.map((p) => ({ ...p, spot: false })), ...SPOTS.map((p) => ({ ...p, spot: true }))];
const pointHref = (p) => (p.spot ? p.href : (p.id === 'home' ? '#field-panel' : `/${p.id}/`));
const pointData = (p) => (p.spot ? `data-spot="${p.id}"` : `data-stop="${p.id}"`);
const iconOf = (p) => POINTS.findIndex((q) => q.id === p.id);

// The content of one "## Heading" section of content/about.md, without its heading and without its id (no duplicate ids).
function aboutSection(aboutParts, id) {
  const part = aboutParts.find((p) => p.startsWith(`<section id="${id}"`));
  if (!part) throw new Error(`content/about.md: section "${id}" not found`);
  return part.replace(/^<section[^>]*>\s*<h2>[\s\S]*?<\/h2>\s*/, '').replace(/\s*<\/section>\s*$/, '');
}

const cvLinks = (primary = 'button') => `<ul class="actions">
              <li><a class="${primary}" href="mailto:${EMAIL}">${EMAIL}</a></li>
              <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_EN.pdf">CV (English, PDF)</a></li>
              <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es" lang="es">CV en español (PDF)</a></li>
            </ul>`;

async function ballpark(cases, { aboutParts, how, status }) {
  const bySlug = Object.fromEntries(cases.map((c) => [c.data.slug, c]));
  const pct = (value, total) => `${+((value / total) * 100).toFixed(3)}%`;
  const facts = await readFile(root('content/facts.md'), 'utf8');
  const schools = [facts.match(/^- Education: (.+)$/m)?.[1], ...[...facts.matchAll(/^ {2}- (.+)$/gm)].map((m) => m[1])].filter(Boolean);
  if (schools.length < 4) throw new Error('content/facts.md: the Education lines are missing');

  const points = POINTS.map((p) => `                  <li><a class="base${p.spot ? ' spot' : ''}" href="${pointHref(p)}" ${pointData(p)} data-tag="${p.tag}" style="--x: ${pct(p.x, FIELD.width)}; --y: ${pct(p.y, FIELD.height)}; --icon: ${iconOf(p)}"><span class="base-icon"></span><span class="base-text"><span class="base-label">${escape(p.label)}</span> <span class="base-name">${escape(p.name)}</span></span></a></li>`);
  const legend = POINTS.map((p) => `          <li><a href="${pointHref(p)}" ${pointData(p)}><span class="base-icon" style="--icon: ${iconOf(p)}" aria-hidden="true"></span> <span class="map-name">${escape(p.name)}</span> <span class="map-label">${escape(p.label)}</span></a></li>`);
  // Crew sprites (coaches, teammates, pitcher): decoration only, so hidden from screen readers.
  const crew = CREW.map((m) => `                  <div class="sprite crew-sprite${m.flip ? ' is-flipped' : ''}" data-crew="${m.id}" style="--x: ${pct(m.x, FIELD.width)}; --y: ${pct(m.y, FIELD.height)}; --row: ${CREW_ROWS.indexOf(m.who)}"></div>`);
  const covers = Object.fromEntries(await Promise.all(cases.map(async ({ data }) => [data.slug, { src: data.cover, ...(await imageSize(data.cover)) }])));
  const nipotyno = bySlug.nipotyno;

  const panels = [
    `          <article class="panel-card" data-panel="home">
            <p class="kicker">Home plate · Start here</p>
            <h3>Every point is a part of the portfolio</h3>
            <p>Swing at the pitch for a home-run tour of my projects — or click or tap anything in the ballpark (or use the <kbd>←</kbd> <kbd>→</kbd> keys on the bases). Start with my main project:</p>
            <p><a class="button" href="/nipotyno/" data-read>${escape(shortName(nipotyno))} — read the case study</a></p>
            <p class="small">${escape(nipotyno.data.description)}</p>
          </article>`,
    ...cases.map(({ data }) => {
      const stop = STOPS.find((s) => s.id === data.slug);
      const cover = covers[data.slug];
      const numbers = data.stats ? `<ul class="key-numbers" aria-label="Key numbers">${data.stats.split(' · ').map((n) => `<li>${escape(n)}</li>`).join('')}</ul>` : '';
      return `          <article class="panel-card" data-panel="${data.slug}" hidden>
            <img class="panel-cover" src="${cover.src}" alt="" width="${cover.width}" height="${cover.height}" loading="lazy" decoding="async">
            <p class="kicker">${escape(stop.label)} · ${escape(stop.name)}</p>
            <h3>${escape(shortName({ data }))}<span class="sub">${escape(subtitle({ data }))}</span></h3>
            ${numbers}
            <p class="card-links"><a class="button" href="/${data.slug}/" data-read>Read the case study<span class="visually-hidden">: ${escape(shortName({ data }))}</span> →</a> <a class="pdf-link" href="/pdf/${pdfName(data.slug)}">PDF<span class="visually-hidden"> of ${escape(shortName({ data }))}</span></a></p>
            <p>${escape(data.tldr)}</p>
            ${data.role ? `<p class="small"><strong>My role:</strong> ${escape(data.role)}</p>` : ''}
          </article>`;
    }),
    `          <article class="panel-card" data-panel="done" hidden>
            <p class="kicker">Home run · Tour complete</p>
            <h3>That's the tour!</h3>
            <p>Thanks for running the bases with me. If you need someone who finds out first and then designs, let's talk about a UX internship in Madrid (Feb–Jul 2027).</p>
            <ul class="actions">
              <li><a class="button" href="/cv/CV_Riccardo_Cirillo_EN.pdf">CV (English, PDF)</a></li>
              <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es" lang="es">CV en español</a></li>
              <li><a class="button ghost" href="mailto:${EMAIL}">Email me</a></li>
            </ul>
            <p><button class="button ghost" type="button" data-action="again">Take another swing</button></p>
          </article>`,
    `          <article class="panel-card" data-panel="about" hidden>
            <p class="kicker">Scoreboard · About</p>
            <h3>Player stats</h3>
            ${aboutSection(aboutParts, 'hi-im-riccardo')}
            <h4>Studies</h4>
            <ul class="card-list">${schools.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
            <h4>Languages and status</h4>
            <p>${escape(status)}</p>
            <h4>Why baseball?</h4>
            ${aboutSection(aboutParts, 'why-baseball')}
            <h4>Toolbox</h4>
            ${aboutSection(aboutParts, 'toolbox')}
          </article>`,
    `          <article class="panel-card" data-panel="how" hidden>
            <p class="kicker">Pitcher's mound · How I design</p>
            <h3>How I design</h3>
            <h4>Principles</h4>
            ${how.principles}
            <h4>Three uniforms, three skill sets</h4>
            ${how.uniforms}
            <h4>Moodboard</h4>
            ${how.moodboard}
          </article>`,
    `          <article class="panel-card" data-panel="contact" hidden>
            <p class="kicker">Ticket booth · Contact &amp; CV</p>
            <h3>Contact &amp; CV</h3>
            <p>UX Research &amp; Design intern · Madrid · Feb–Jul 2027</p>
            <p class="small">${escape(status)}</p>
            ${cvLinks()}
          </article>`,
  ];

  return `      <section id="field" class="field" aria-labelledby="field-title">
        <div class="field-head wrap wide">
          <h2 id="field-title">Explore the ballpark</h2>
          <p class="hint">A small game on top of the portfolio. <a href="#work">Prefer a list? Skip to the case studies</a></p>
        </div>
        <div class="ballpark">
          <div class="stage-col">
            <div class="stage">
              <div class="field-box">
                <div class="world">
                  <img class="field-img" src="/game/field.png" alt="Pixel-art baseball stadium. Every base and point links to a part of the portfolio." width="${FIELD.width}" height="${FIELD.height}">
${crew.join('\n')}
                  <div class="sprite runner" style="--x: ${pct(STOPS[0].x, FIELD.width)}; --y: ${pct(STOPS[0].y, FIELD.height)}"></div>
                  <div class="ball" hidden></div>
                </div>
                <ul class="bases" aria-label="Stadium">
${points.join('\n')}
                </ul>
              </div>
              <div class="swing-box" hidden><button class="button swing" type="button" data-action="swing"><span aria-hidden="true">⚾</span> Swing!</button></div>
              <p class="banner" aria-hidden="true" hidden>Home run!</p>
              <div class="tour-map" aria-hidden="true" hidden>
                <span class="tour-diamond"><i data-corner="second"></i><i data-corner="third"></i><i data-corner="first"></i><i data-corner="home"></i></span>
                <span class="tour-count"></span>
              </div>
            </div>
            <div class="game-bar" hidden>
              <div class="bar-row" data-mode="bat">
                <p class="bar-hint"><strong>…or click anything in the ballpark.</strong><span class="no-touch"> Press <kbd>Space</kbd> to swing.</span></p>
              </div>
              <div class="bar-row" data-mode="tour" hidden>
                <button class="link" type="button" data-action="free"><span aria-hidden="true">✕</span> Exit tour</button>
              </div>
              <div class="bar-row" data-mode="free" hidden>
                <button class="button ghost" type="button" data-action="again">Take another swing</button>
                <p class="bar-hint">Click or tap anything in the ballpark<span class="no-touch">, or use the <kbd>←</kbd> <kbd>→</kbd> keys on the bases</span>.</p>
              </div>
              <p class="bar-tools"><button class="link sound-toggle" type="button" data-action="sound" aria-pressed="false"><span aria-hidden="true">♪</span> Sound <span class="state" aria-hidden="true">off</span></button></p>
              <p class="visually-hidden" role="status"></p>
            </div>
          </div>
          <div class="panel" id="field-panel" tabindex="-1" role="region" aria-label="Card">
            <button class="panel-close" type="button" data-action="close" hidden><span aria-hidden="true">✕</span> Close</button>
${panels.join('\n')}
          </div>
        </div>
        <nav class="stadium-map wrap wide" aria-labelledby="map-title">
          <h3 id="map-title">Stadium map</h3>
          <ul>
${legend.join('\n')}
          </ul>
        </nav>
      </section>`;
}

// "How I design": principles (content/about.md), the three uniforms and their skills, the moodboard.
// The pieces are used twice: in the section of the page (#how) and in the mound's card in the stadium (without ids).
function howPieces(cases, principles) {
  const bySlug = Object.fromEntries(cases.map((c) => [c.data.slug, c]));
  const uniformCards = UNIFORMS.map((u) => {
    const c = bySlug[u.suggested];
    return `            <div class="uniform-card" data-uniform="${u.id}">
              <h3>Your uniform: ${u.label}</h3>
              <ul class="skills">${u.skills.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
              <p>Suggested case: <a href="/${c.data.slug}/">${escape(shortName(c))} — ${escape(subtitle(c))}</a></p>
            </div>`;
  });
  const uniforms = `<ul class="uniform-list">${UNIFORMS.map((u) => {
    const c = bySlug[u.suggested];
    return `<li><strong>${u.label}</strong> <span class="skills-inline">${u.skills.map(escape).join(' · ')}</span> <span class="small">Suggested first base: <a href="/${c.data.slug}/" data-read>${escape(shortName(c))}</a></span></li>`;
  }).join('')}</ul>`;
  const swatches = ['navy', 'red', 'sky', 'grass', 'dirt', 'yellow'].map(
    (name) => `<li><span class="swatch" style="background: ${PALETTE[name]}"></span>${name} <code>${PALETTE[name]}</code></li>`,
  );
  const moodboard = `<ul class="swatches" aria-label="Colour palette">${swatches.join('')}</ul>
            <p><strong>Type:</strong> an original 5×7 pixel font for titles, a plain system font for reading.</p>
            <p><strong>Mood:</strong> a day game — blue sky, green grass, 16-bit arcade. Style reference: <a href="https://ponywolf.com/retro-pixel-baseball">Retro Pixel Baseball by Ponywolf</a> (all art here is my own).</p>`;
  return { principles, uniformCards: uniformCards.join('\n'), uniforms, moodboard };
}

function howIDesign(how) {
  return `      <section id="how" class="how wrap wide" aria-labelledby="how-title">
        <h2 id="how-title">How I design</h2>
        <div class="how-grid">
          <div class="how-block">
            <h3>Principles</h3>
            ${how.principles}
          </div>
          <div class="how-block">
${how.uniformCards}
          </div>
          <div class="how-block moodboard">
            <h3>Moodboard</h3>
            ${how.moodboard}
          </div>
        </div>
      </section>`;
}

// Lobby (first screen, not a gate): "Select your player" on one side, the player card (a short About) on the other.
// Everything a recruiter needs is visible at once: name, role, Madrid and dates, status, CV EN/ES, email, Nipotyno.
// The uniform switch is plain CSS (radio + :has() in style.css); src/uniform.js remembers it and adds ◀ ▶ on phones.
// Numbers on the card come from content/facts.md and content/about.md, so they can never disagree with the CV.
async function cardStats() {
  const facts = await readFile(root('content/facts.md'), 'utf8');
  const languages = facts.match(/^- Languages: (.+)$/m)?.[1].split(' · ').length;
  const sus = facts.match(/SUS ([\d.]+)/)?.[1];
  if (!languages || !sus) throw new Error('content/facts.md: Languages or the SUS score is missing');
  return [['3', 'countries'], [String(languages), 'languages'], [sus, 'SUS · Nipotyno']];
}

function startScreen(cases, about, status, stats) {
  const nipotyno = cases.find((c) => c.data.slug === 'nipotyno');
  const bio = about.body.match(/## Hi, I'm Riccardo\n([^\n]+)/)?.[1];
  if (!bio) throw new Error('content/about.md: the "Hi, I\'m Riccardo" paragraph is missing');
  const suggested = (u) => STOPS.find((s) => s.id === u.suggested).name;
  const tiles = UNIFORMS.map((u, i) => `            <label class="uniform-tile" style="--row: ${u.row}">
              <input type="radio" name="uniform" id="u-${u.id}" value="${u.id}"${i === 0 ? ' checked' : ''} aria-labelledby="u-${u.id}-name" aria-describedby="u-${u.id}-desc">
              <span class="portrait" aria-hidden="true"></span>
              <span class="tile-name" id="u-${u.id}-name">${u.label}</span>
              <span class="tile-desc" id="u-${u.id}-desc"><span class="tile-skills">${u.skills.slice(0, 3).map(escape).join(' · ')}</span> <span class="tile-suggest">Suggested first base: ${suggested(u)}</span></span>
            </label>`);
  const white = { color: PALETTE.white, shadow: PALETTE.navyDark };
  return `      <section class="hero lobby wrap wide" aria-labelledby="name">
        <div class="player-select">
          <fieldset class="uniforms">
            <legend><span class="pixel-heading" aria-hidden="true">${pixelText('Select your player', { color: PALETTE.yellow, shadow: PALETTE.red })}</span><span class="visually-hidden">Select your player</span></legend>
            <div class="player-stage">
              <button class="uniform-step" type="button" data-step="-1" hidden><span aria-hidden="true">◀</span><span class="visually-hidden">Previous uniform</span></button>
              <div class="batter" aria-hidden="true"></div>
              <button class="uniform-step" type="button" data-step="1" hidden><span aria-hidden="true">▶</span><span class="visually-hidden">Next uniform</span></button>
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
            <p class="headline">UX Research &amp; Design intern · Madrid · Feb–Jul 2027</p>
            <p class="status-line">${escape(status)}</p>
            <p class="motto">“${escape(about.data.motto)}”</p>
            <ul class="card-stats">${stats.map(([n, label]) => `<li><strong>${escape(n)}</strong> ${escape(label)}</li>`).join('')}</ul>
            <p class="card-bio">${escape(bio)}</p>
            <ul class="actions">
              <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_EN.pdf">Download CV (English, PDF)</a></li>
              <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es" lang="es">CV en español (PDF)</a></li>
              <li><a class="button ghost" href="mailto:${EMAIL}">${EMAIL}</a></li>
            </ul>
            <a class="start-here" href="/nipotyno/" data-read><span class="kicker">Start here · Main case</span> <strong>${escape(shortName(nipotyno))} — ${escape(subtitle(nipotyno))} <span aria-hidden="true">→</span></strong></a>
          </div>
        </article>
        <p class="lobby-cta">
          <a class="button enter" href="#field"><span aria-hidden="true">▶</span> Enter the ballpark</a>
          <a class="skip-list" href="#work">Skip → Case studies</a>
        </p>
      </section>`;
}

async function homePage(cases, about, status, stats) {
  const cards = await Promise.all(
    cases.map(async ({ data }, i) => {
      const { width, height } = await imageSize(data.cover);
      return `<li class="case-card" id="${data.slug}">
  <a href="/${data.slug}/" data-read>
    <img src="${data.cover}" alt="" width="${width}" height="${height}"${i > 1 ? ' loading="lazy"' : ''} decoding="async">
    <span class="kicker">${escape(data.base)} · ${escape(shortName({ data }))}</span>
    <h3>${escape(subtitle({ data }) || shortName({ data }))}</h3>
  </a>
  <p>${escape(data.description)}</p>
</li>`;
    }),
  );

  // About: the motto is already in the hero, the principles in "How I design", contacts in the footer: skip those parts.
  const aboutParts = sections(await markdown(about.body)).split(/(?=<section)/);
  const aboutHtml = aboutParts
    .filter((part) => !/id="(i-dont-know|how-i-design|contact)/.test(part))
    .join('\n')
    .replace(/<h2>/g, '<h3>').replace(/<\/h2>/g, '</h3>');
  const principles = aboutParts.find((part) => part.includes('id="how-i-design"')).match(/<ol>[\s\S]*<\/ol>/)[0];

  const how = howPieces(cases, principles);
  const main = `${startScreen(cases, about, status, stats)}
${await ballpark(cases, { aboutParts, how, status })}
${howIDesign(how)}
      <section id="work" class="work wrap" aria-labelledby="work-title" tabindex="-1">
        <h2 id="work-title">Case studies</h2>
        <ul class="case-list">
${cards.join('\n')}
        </ul>
      </section>
      <section id="about" class="about wrap" aria-labelledby="about-title">
        <h2 id="about-title">About me</h2>
        <p class="status-line">${escape(status)}</p>
${aboutHtml}
      </section>
      <section id="contact" class="contact wrap" aria-labelledby="contact-title">
        <h2 id="contact-title">Contact &amp; CV</h2>
        <p>UX Research &amp; Design intern · Madrid · Feb–Jul 2027</p>
        ${cvLinks()}
      </section>`;

  return layout({
    title: 'Riccardo Cirillo — UX Research & Design',
    description: 'Riccardo Cirillo, UX Research & Design intern · Madrid · Feb–Jul 2027. Case studies, CV and contacts.',
    path: '/',
    image: await ogHome(),
    imageAlt: 'Pixel-art baseball field under the title Riccardo Cirillo, UX Research & Design, Madrid 2027',
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
  const load = async (slug) => parse(await readFile(root(`content/${slug}.md`), 'utf8'));
  const cases = await Promise.all(CASES.map(load));
  const about = await load('about');

  await writeFile(root('index.html'), await homePage(cases, about, await statusLine(), await cardStats()));
  for (const [i, c] of cases.entries()) {
    await mkdir(root(c.data.slug), { recursive: true });
    await writeFile(root(`${c.data.slug}/index.html`), await casePage(c, i, cases));
  }
  console.log(`✓ pages generated: ${PAGES.join(', ')}`);
}

// Run directly: node scripts/pages.js
if (process.argv[1] === fileURLToPath(import.meta.url)) await generate();
