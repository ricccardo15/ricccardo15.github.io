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

const SITE = 'https://ricccardo15.github.io';
const EMAIL = 'riccardo.cirillo.work@gmail.com';
// Order on the home and on the diamond: 1st, 2nd, 3rd base, dugout.
export const CASES = ['nipotyno', 'levante', 'housing', 'lab'];
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

// LinkedIn and some chat apps don't read WebP previews: make a 1200×630 JPG copy for each page.
async function ogImage(src, name) {
  await mkdir(root('public/og'), { recursive: true });
  await sharp(root(`public${src}`))
    .resize(1200, 630, { fit: 'contain', background: '#f7f4ec' })
    .flatten({ background: '#f7f4ec' })
    .jpeg({ quality: 82 })
    .toFile(root(`public/og/${name}.jpg`));
  return `/og/${name}.jpg`;
}

// --- Layout -----------------------------------------------------------------

function layout({ title, description, path, image, main, bodyClass = '' }) {
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
    <meta name="twitter:card" content="summary_large_image">
    <link rel="stylesheet" href="/src/style.css">
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
        <p class="crumb"><a href="/#${data.slug}">← All case studies</a></p>
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
    image: await ogImage(data.og_image, data.slug),
    main,
  });
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

  // About: the motto is already in the header and contacts are in the footer, so skip those parts.
  const aboutHtml = sections(await markdown(about.body))
    .split(/(?=<section)/)
    .filter((part) => !/id="(i-dont-know|contact)/.test(part))
    .join('\n')
    .replace(/<h2>/g, '<h3>').replace(/<\/h2>/g, '</h3>');

  const main = `      <section class="hero wrap" aria-labelledby="name">
        <h1 id="name">Riccardo Cirillo</h1>
        <p class="headline">UX Research &amp; Design intern · Madrid · Feb–Jul 2027</p>
        <p class="motto">“${escape(about.data.motto)}”</p>
        <ul class="actions">
          <li><a class="button" href="/cv/CV_Riccardo_Cirillo_EN.pdf">Download CV (English, PDF)</a></li>
          <li><a class="button ghost" href="/cv/CV_Riccardo_Cirillo_ES.pdf" hreflang="es">CV en español (PDF)</a></li>
          <li><a class="button ghost" href="mailto:${EMAIL}">${EMAIL}</a></li>
        </ul>
      </section>
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
    image: await ogImage(cases[0].data.cover, 'home'),
    main,
    bodyClass: 'home',
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
