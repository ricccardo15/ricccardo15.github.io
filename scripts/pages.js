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
import { FIELD, STOPS, CREW, CREW_ROWS } from '../src/field-map.js';
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
        return `<img src="${href}" alt="${escape(text)}" width="${width}" height="${height}" loading="lazy" decoding="async">`;
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
  const home = STOPS.find((s) => s.id === 'home');
  const batter = await sharp(root('public/game/runner.png'))
    .extract({ left: 6 * 32, top: 0, width: 32, height: 32 }) // swing stance, Researcher uniform
    .resize(128, 128, { kernel: 'nearest' })
    .toBuffer();
  const field = await sharp(root('public/game/field.png'))
    .resize(1280, 720, { kernel: 'nearest' })
    .extract({ left: 40, top: 90, width: OG.width, height: OG.height })
    .toBuffer();
  return saveOg('home', sharp(field).composite([
    { input: batter, left: home.x * 4 - 40 - 64, top: (home.y + 3) * 4 - 90 - 128 },
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
            <li><a href="/cv/CV_Riccardo_Cirillo_EN.pdf">CV <abbr title="English">EN</abbr></a></li>
            <li><a href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es">CV <abbr title="Español">ES</abbr></a></li>
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
        <p><a href="mailto:${EMAIL}">${EMAIL}</a> · CV: <a href="/cv/CV_Riccardo_Cirillo_EN.pdf">English</a> · <a href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es">Español</a></p>
      </div>
    </footer>
  </body>
</html>
`;
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

  const main = `      <article class="case wrap">
        <p class="print-head">Riccardo Cirillo · UX Research &amp; Design intern · ${EMAIL} · ${SITE.replace('https://', '')}/${data.slug}/</p>
        <p class="crumb"><a href="/#${data.slug}">← All case studies</a> · <a href="/pdf/${pdfName(data.slug)}">Download PDF<span class="visually-hidden"> of this case study</span></a></p>
        <p class="kicker">${escape(data.base)} · ${escape(shortName(c))}</p>
        <h1>${escape(shortName(c))}${subtitle(c) ? `<span class="sub">${escape(subtitle(c))}</span>` : ''}</h1>
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

// The ballpark: pixel field + bases as real links + one panel per stop.
// Without JavaScript the bases are plain links to the case pages; src/diamond.js adds the game:
// batting, the home-run tour (one project per base) and free running. The game bar stays hidden without JS.
// Under 700 px it is shown at 1× with simplified touch labels (see style.css).
async function diamond(cases) {
  const bySlug = Object.fromEntries(cases.map((c) => [c.data.slug, c]));
  const pct = (value, total) => `${+((value / total) * 100).toFixed(3)}%`;
  const bases = STOPS.map((stop, i) => {
    const href = stop.id === 'home' ? '#field-panel' : `/${stop.id}/`;
    return `          <li><a class="base" href="${href}" data-stop="${stop.id}" data-tag="${stop.tag}" style="--x: ${pct(stop.x, FIELD.width)}; --y: ${pct(stop.y, FIELD.height)}; --icon: ${i}"><span class="base-icon"></span><span class="base-text"><span class="base-label">${stop.label}</span> <span class="base-name">${stop.name}</span></span></a></li>`;
  });
  const main = bySlug.nipotyno.data;
  // Crew sprites (coaches, teammates, pitcher): decoration only, so hidden from screen readers.
  const crew = CREW.map((m) => `              <div class="sprite crew-sprite${m.flip ? ' is-flipped' : ''}" data-crew="${m.id}" style="--x: ${pct(m.x, FIELD.width)}; --y: ${pct(m.y, FIELD.height)}; --row: ${CREW_ROWS.indexOf(m.who)}"></div>`);
  const covers = Object.fromEntries(await Promise.all(cases.map(async ({ data }) => [data.slug, { src: data.cover, ...(await imageSize(data.cover)) }])));
  const panels = [
    `          <article class="panel-card" data-panel="home">
            <p class="kicker">Home plate · Start here</p>
            <h3>Every base is a project</h3>
            <p>Swing at the pitch for a home-run tour of my projects — or click or tap any base (or use the <kbd>←</kbd> <kbd>→</kbd> keys) and I'll run there. Start with my main project:</p>
            <p><a class="button" href="/nipotyno/">${escape(shortName(bySlug.nipotyno))} — read the case study</a></p>
            <p class="small">${escape(main.description)}</p>
          </article>`,
    ...cases.map(({ data }) => {
      const stop = STOPS.find((s) => s.id === data.slug);
      const cover = covers[data.slug];
      return `          <article class="panel-card" data-panel="${data.slug}" hidden>
            <img class="panel-cover" src="${cover.src}" alt="" width="${cover.width}" height="${cover.height}" loading="lazy" decoding="async">
            <p class="kicker">${escape(stop.label)} · ${escape(stop.name)}</p>
            <h3>${escape(shortName({ data }))}<span class="sub">${escape(subtitle({ data }))}</span></h3>
            <p>${escape(data.tldr)}</p>
            ${data.role ? `<p class="small"><strong>My role:</strong> ${escape(data.role)}</p>` : ''}
            <p><a class="button" href="/${data.slug}/">Read the case study<span class="visually-hidden">: ${escape(shortName({ data }))}</span> →</a></p>
          </article>`;
    }),
    `          <article class="panel-card" data-panel="done" hidden>
            <p class="kicker">Home run · Tour complete</p>
            <h3>That's the tour!</h3>
            <p>Thanks for running the bases with me. If you need someone who finds out first and then designs, let's talk about a UX internship in Madrid (Feb–Jul 2027).</p>
            <ul class="actions">
              <li><a class="button" href="/cv/CV_Riccardo_Cirillo_EN.pdf">CV (English, PDF)</a></li>
              <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es">CV en español</a></li>
              <li><a class="button ghost" href="mailto:${EMAIL}">Email me</a></li>
            </ul>
            <p><button class="button ghost" type="button" data-action="again">Take another swing</button></p>
          </article>`,
  ];
  return `      <section id="field" class="field wrap wide" aria-labelledby="field-title">
        <h2 id="field-title">Explore the ballpark</h2>
        <p class="hint">A small game on top of the portfolio. <a href="#work">Prefer a list? Skip to the case studies</a></p>
        <div class="field-layout">
          <div class="stage-col">
            <div class="stage">
              <div class="world">
                <img class="field-img" src="/game/field.png" alt="Pixel-art baseball field. Each base links to a project." width="${FIELD.width}" height="${FIELD.height}">
${crew.join('\n')}
                <div class="sprite runner" style="--x: ${pct(STOPS[0].x, FIELD.width)}; --y: ${pct(STOPS[0].y, FIELD.height)}"></div>
                <div class="ball" hidden></div>
              </div>
              <ul class="bases" aria-label="Bases">
${bases.join('\n')}
              </ul>
              <p class="banner" aria-hidden="true" hidden>Home run!</p>
            </div>
            <div class="game-bar" hidden>
              <div class="bar-row" data-mode="bat">
                <button class="button swing" type="button" data-action="swing">Swing!</button>
                <p class="bar-hint">Click or tap the field<span class="no-touch">, or press <kbd>Space</kbd>,</span> to hit the pitch. <button class="link" type="button" data-action="free">Just explore the bases</button></p>
              </div>
              <div class="bar-row" data-mode="tour" hidden>
                <button class="button ghost" type="button" data-action="back"><span aria-hidden="true">◀</span> Back</button>
                <button class="button ghost" type="button" data-action="pause">Pause</button>
                <button class="button" type="button" data-action="next">Next <span aria-hidden="true">▶</span></button>
                <span class="tour-step"></span>
                <button class="link" type="button" data-action="free">Explore freely</button>
                <div class="timer" aria-hidden="true"><span></span></div>
              </div>
              <div class="bar-row" data-mode="free" hidden>
                <button class="button ghost" type="button" data-action="again">Take another swing</button>
                <p class="bar-hint">Click or tap a base<span class="no-touch">, or use the <kbd>←</kbd> <kbd>→</kbd> keys</span>.</p>
              </div>
              <p class="bar-tools"><button class="link sound-toggle" type="button" data-action="sound" aria-pressed="false"><span aria-hidden="true">♪</span> Sound <span class="state" aria-hidden="true">off</span></button></p>
              <p class="visually-hidden" role="status"></p>
            </div>
          </div>
          <div class="panel" id="field-panel" tabindex="-1" aria-live="polite">
${panels.join('\n')}
          </div>
        </div>
      </section>`;
}

// Start screen "At bat": Riccardo at bat + uniform picker on one side, name/CV/contacts on the other.
// Not a gate: everything a recruiter needs is here at once. The uniform switch is plain CSS
// (radio + :has() in style.css); src/uniform.js only remembers the choice.
function startScreen(cases, about) {
  const nipotyno = cases.find((c) => c.data.slug === 'nipotyno');
  const radios = UNIFORMS.map((u, i) => `            <label><input type="radio" name="uniform" id="u-${u.id}" value="${u.id}"${i === 0 ? ' checked' : ''}> ${u.label}</label>`);
  return `      <section class="hero wrap wide" aria-labelledby="name">
        <div class="intro">
          <h1 id="name"><img class="pixel-title" src="/game/title.svg" alt="" width="128" height="8"><span class="visually-hidden">Riccardo Cirillo</span></h1>
          <p class="headline">UX Research &amp; Design intern · Madrid · Feb–Jul 2027</p>
          <p class="motto">“${escape(about.data.motto)}”</p>
          <ul class="actions">
            <li><a class="button" href="/cv/CV_Riccardo_Cirillo_EN.pdf">Download CV (English, PDF)</a></li>
            <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es">CV en español (PDF)</a></li>
            <li><a class="button ghost" href="mailto:${EMAIL}">${EMAIL}</a></li>
          </ul>
          <a class="start-here" href="/nipotyno/"><span class="kicker">Start here · Main case</span> <strong>${escape(shortName(nipotyno))} — ${escape(subtitle(nipotyno))}</strong></a>
          <ul class="play">
            <li class="play-ball"><a class="button" href="#field">Play ball! <span aria-hidden="true">→</span> <span class="small-label">explore the ballpark</span></a></li>
            <li><a class="skip-list" href="#work">Skip → Case studies</a></li>
          </ul>
        </div>
        <div class="at-bat">
          <div class="batter" aria-hidden="true"></div>
          <fieldset class="uniforms">
            <legend>Pick my uniform</legend>
${radios.join('\n')}
          </fieldset>
        </div>
      </section>`;
}

// "How I design": principles (content/about.md), the skills of the chosen uniform, and the moodboard.
function howIDesign(cases, principles) {
  const bySlug = Object.fromEntries(cases.map((c) => [c.data.slug, c]));
  const uniformCards = UNIFORMS.map((u) => {
    const c = bySlug[u.suggested];
    return `            <div class="uniform-card" data-uniform="${u.id}">
              <h3>Your uniform: ${u.label}</h3>
              <ul class="skills">${u.skills.map((s) => `<li>${escape(s)}</li>`).join('')}</ul>
              <p>Suggested case: <a href="/${c.data.slug}/">${escape(shortName(c))} — ${escape(subtitle(c))}</a></p>
            </div>`;
  });
  const swatches = ['navy', 'red', 'sky', 'grass', 'dirt', 'yellow'].map(
    (name) => `<li><span class="swatch" style="background: ${PALETTE[name]}"></span>${name} <code>${PALETTE[name]}</code></li>`,
  );
  return `      <section id="how" class="how wrap wide" aria-labelledby="how-title">
        <h2 id="how-title">How I design</h2>
        <div class="how-grid">
          <div class="how-block">
            <h3>Principles</h3>
            ${principles}
          </div>
          <div class="how-block">
${uniformCards.join('\n')}
          </div>
          <div class="how-block moodboard">
            <h3>Moodboard</h3>
            <ul class="swatches" aria-label="Colour palette">${swatches.join('')}</ul>
            <p><strong>Type:</strong> an original 5×7 pixel font for titles, a plain system font for reading.</p>
            <p><strong>Mood:</strong> a day game — blue sky, green grass, 16-bit arcade. Style reference: <a href="https://ponywolf.com/retro-pixel-baseball">Retro Pixel Baseball by Ponywolf</a> (all art here is my own).</p>
          </div>
        </div>
      </section>`;
}

async function homePage(cases, about) {
  const cards = await Promise.all(
    cases.map(async ({ data }, i) => {
      const { width, height } = await imageSize(data.cover);
      return `<li class="case-card" id="${data.slug}">
  <a href="/${data.slug}/">
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

  const main = `${startScreen(cases, about)}
${await diamond(cases)}
${howIDesign(cases, principles)}
      <section id="work" class="work wrap" aria-labelledby="work-title" tabindex="-1">
        <h2 id="work-title">Case studies</h2>
        <ul class="case-list">
${cards.join('\n')}
        </ul>
      </section>
      <section id="about" class="about wrap" aria-labelledby="about-title">
        <h2 id="about-title">About me</h2>
${aboutHtml}
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
      '<script type="module" src="/src/diamond.js"></script>',
      '<script type="module" src="/src/uniform.js"></script>',
    ].join('\n    '),
  });
}

export async function generate() {
  const load = async (slug) => parse(await readFile(root(`content/${slug}.md`), 'utf8'));
  const cases = await Promise.all(CASES.map(load));
  const about = await load('about');

  await writeFile(root('index.html'), await homePage(cases, about));
  for (const [i, c] of cases.entries()) {
    await mkdir(root(c.data.slug), { recursive: true });
    await writeFile(root(`${c.data.slug}/index.html`), await casePage(c, i, cases));
  }
  console.log(`✓ pages generated: ${PAGES.join(', ')}`);
}

// Run directly: node scripts/pages.js
if (process.argv[1] === fileURLToPath(import.meta.url)) await generate();
