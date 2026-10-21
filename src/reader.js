// Read a case study without leaving the stadium (home page).
// A click on a link with data-read ("Read the case study", "Start here", the list cards, previous/next inside a case)
// fetches the real page (/nipotyno/), takes its <article class="case"> and its pixel band and shows them in a full-screen
// <dialog> styled like a pause menu, with "✕ Back to the ballpark". The address becomes /nipotyno/ (pushState),
// so a reload opens the normal static page (Open Graph, PDF and all). Esc, ✕ or the browser Back close it:
// the focus goes back to the link that opened it and the page is where it was.
// Without JS, or if the page cannot be fetched, the link simply navigates.
const PREFIX = 'reader-'; // ids inside the dialog get it, so no id is ever duplicated in the page

let dialog = null;
let origin = null; // the link that opened the reader
let scroll = 0; // where the page was

function build() {
  dialog = document.createElement('dialog');
  dialog.className = 'reader';
  dialog.setAttribute('aria-labelledby', `${PREFIX}case-title`);
  dialog.innerHTML = `<div class="reader-band case-band">
      <div class="wrap band-row">
        <span class="reader-name"></span>
        <button class="reader-close" type="button"><span aria-hidden="true">✕</span> Back to the ballpark</button>
      </div>
    </div>
    <div class="reader-body"></div>`;
  document.body.append(dialog);
  dialog.querySelector('.reader-close').addEventListener('click', () => history.back());
  // Esc: the dialog would close itself; go back in the history instead, popstate closes it.
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); history.back(); });
  dialog.addEventListener('click', onLinkInside);
}

// Copy the case into the dialog with prefixed ids (and fix the references to them).
function fill(doc) {
  const article = doc.querySelector('article.case');
  const band = doc.querySelector('.case-band');
  if (!article) throw new Error('no article.case');
  const copy = document.importNode(article, true);
  for (const el of copy.querySelectorAll('[id]')) el.id = PREFIX + el.id;
  for (const el of copy.querySelectorAll('[aria-labelledby], [aria-describedby]')) {
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      if (el.hasAttribute(attr)) el.setAttribute(attr, el.getAttribute(attr).split(' ').map((id) => PREFIX + id).join(' '));
    }
  }
  const name = dialog.querySelector('.reader-name');
  name.replaceChildren(...(band ? [...band.querySelectorAll('.base-icon, .band-name')].map((el) => document.importNode(el, true)) : []));
  dialog.querySelector('.reader-body').replaceChildren(copy);
  dialog.scrollTop = 0;
}

async function load(href) {
  const res = await fetch(href);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return new DOMParser().parseFromString(await res.text(), 'text/html');
}

async function open(href, from, { push = true } = {}) {
  try {
    const doc = await load(href);
    if (!dialog) build();
    fill(doc);
  } catch {
    location.href = href; // fallback: a normal page
    return;
  }
  origin = from;
  scroll = window.scrollY;
  document.documentElement.classList.add('reader-open');
  if (push) history.pushState({ reader: href }, '', href);
  dialog.showModal();
  dialog.querySelector(`#${PREFIX}case-title`)?.focus({ preventScroll: true });
}

function close() {
  if (!dialog?.open) return;
  dialog.close();
  document.documentElement.classList.remove('reader-open');
  window.scrollTo(0, scroll);
  origin?.focus({ preventScroll: true });
  // After a Back the browser finishes its own history step (scroll to the #fragment) and may drop the focus: put it back.
  setTimeout(() => { if (document.activeElement === document.body) origin?.focus({ preventScroll: true }); }, 50);
}

// Links inside the case: previous/next stay in the reader (the address is replaced: one Back still returns to the stadium);
// the way back to the ballpark and "All case studies" close it.
async function onLinkInside(event) {
  const link = event.target.closest('a[href]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const url = new URL(link.href, location.href);
  if (url.origin !== location.origin) return;
  if (link.closest('.pager') && /^\/[a-z]+\/$/.test(url.pathname)) {
    event.preventDefault();
    try {
      fill(await load(url.pathname));
      history.replaceState({ reader: url.pathname }, '', url.pathname);
      dialog.querySelector(`#${PREFIX}case-title`)?.focus({ preventScroll: true });
    } catch {
      location.href = url.pathname;
    }
  } else if (url.pathname === '/' && url.hash) {
    event.preventDefault();
    const target = url.hash.slice(1);
    history.back(); // closes the reader
    if (target === 'work') addEventListener('popstate', () => requestAnimationFrame(() => document.getElementById('work')?.scrollIntoView()), { once: true });
  }
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-read]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  open(link.getAttribute('href'), link);
});

// Back (or Esc / ✕, which go back) closes the reader; Forward to a reader address opens it again.
// The game (src/game.js) sees `event.readerHandled` and leaves its own state alone.
addEventListener('popstate', (event) => {
  if (dialog?.open && !history.state?.reader) {
    event.readerHandled = true;
    close();
  } else if (history.state?.reader && !dialog?.open) {
    event.readerHandled = true;
    open(history.state.reader, origin, { push: false });
  }
});
