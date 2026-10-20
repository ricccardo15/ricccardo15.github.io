// The ballpark game layer (home page). Optional: without this file the bases are plain links.
// - click/tap a base → the runner runs there along the base path and the base's panel opens
// - ← → (focus on the field) → previous/next stop · Esc → close the panel
// - the address shows the base (/#nipotyno): deep links and the browser Back button work
import { FIELD, STOPS, RING } from './field-map.js';

const stage = document.querySelector('.stage');
const field = document.querySelector('#field');
// Under 700 px the field is hidden by CSS (phones get the list), so there is nothing to scroll to or focus.
const visible = () => getComputedStyle(field).display !== 'none';
if (stage) start();

function start() {
  const runner = stage.querySelector('.runner');
  const panel = document.querySelector('#field-panel');
  const links = [...stage.querySelectorAll('.base')];
  const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const SPEED = 110; // field pixels per second

  let current = 'home';
  let pos = { x: byId.home.x, y: byId.home.y };
  let running = null;

  const place = ({ x, y }) => {
    runner.style.setProperty('--x', `${(Math.round(x) / FIELD.width) * 100}%`);
    runner.style.setProperty('--y', `${(Math.round(y) / FIELD.height) * 100}%`);
  };

  // Waypoints from one stop to another: along the base path (shortest way round), via home for the dugout.
  function route(from, to) {
    const ringPath = (a, b) => {
      const i = RING.indexOf(a), j = RING.indexOf(b), n = RING.length;
      const forward = (j - i + n) % n;
      const step = forward <= n - forward ? 1 : -1;
      const path = [];
      for (let k = i; k !== j; ) { k = (k + step + n) % n; path.push(RING[k]); }
      return path;
    };
    if (from === to) return [];
    if (from === 'lab') return ['home', ...ringPath('home', to)];
    if (to === 'lab') return [...ringPath(from, 'home'), 'lab'];
    return ringPath(from, to);
  }

  function showPanel(id) {
    panel.hidden = false;
    for (const card of panel.querySelectorAll('[data-panel]')) card.hidden = card.dataset.panel !== id;
  }

  function mark(id) {
    for (const link of links) {
      if (link.dataset.stop === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  // Move the runner to `id`. Returns a promise that resolves on arrival.
  function runTo(id, { animate = true } = {}) {
    if (running) cancelAnimationFrame(running.frame);
    const stops = route(current, id).map((s) => byId[s]);
    current = id;
    mark(id);
    if (!animate || reduceMotion.matches || !stops.length) {
      pos = { x: byId[id].x, y: byId[id].y };
      place(pos);
      showPanel(id);
      return Promise.resolve();
    }
    stage.classList.add('is-running');
    return new Promise((resolve) => {
      let last = performance.now();
      const tick = (now) => {
        let budget = (SPEED * (now - last)) / 1000;
        last = now;
        while (budget > 0 && stops.length) {
          const target = stops[0];
          const dx = target.x - pos.x, dy = target.y - pos.y;
          const dist = Math.hypot(dx, dy);
          if (dist <= budget) { pos = { x: target.x, y: target.y }; budget -= dist; stops.shift(); }
          else { pos = { x: pos.x + (dx / dist) * budget, y: pos.y + (dy / dist) * budget }; budget = 0; }
          runner.classList.toggle('is-flipped', dx < 0);
        }
        place(pos);
        if (stops.length) running.frame = requestAnimationFrame(tick);
        else { running = null; stage.classList.remove('is-running'); showPanel(id); resolve(); }
      };
      running = { frame: requestAnimationFrame(tick) };
    });
  }

  function go(id, { focus = 'panel', history: push = true } = {}) {
    if (push && location.hash !== `#${id}`) history.pushState({ stop: id }, '', `#${id}`);
    const arrived = runTo(id);
    if (focus === 'base') links.find((l) => l.dataset.stop === id).focus();
    else arrived.then(() => panel.focus({ preventScroll: true }));
  }

  for (const link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      go(link.dataset.stop);
    });
  }

  field.addEventListener('keydown', (event) => {
    const index = STOPS.findIndex((s) => s.id === current);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      if (!event.target.closest('.stage, .panel')) return;
      event.preventDefault();
      const step = event.key === 'ArrowRight' ? 1 : -1;
      go(STOPS[(index + step + STOPS.length) % STOPS.length].id, { focus: 'base' });
    } else if (event.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      history.replaceState(null, '', location.pathname + location.search);
      links.find((l) => l.dataset.stop === current).focus();
    }
  });

  // Deep link (/#levante) and Back/Forward: jump straight to that base.
  const fromHash = ({ scroll }) => {
    const id = location.hash.slice(1);
    if (!byId[id]) return false;
    runTo(id, { animate: false });
    // The list cards share these ids, so the browser scrolls to the card on load: scroll back to the field after it.
    if (scroll && visible()) {
      // Chrome keeps the page pinned to the #id target while images load, undoing our scroll:
      // on desktop the field is the deep-link view, so take the id off the list card.
      const card = document.getElementById(id);
      if (card && !field.contains(card)) { card.dataset.id = id; card.removeAttribute('id'); }
      const toField = () => requestAnimationFrame(() => field.scrollIntoView({ block: 'start' }));
      if (document.readyState === 'complete') toField();
      else window.addEventListener('load', toField, { once: true });
    }
    return true;
  };
  window.addEventListener('popstate', () => fromHash({ scroll: false }) || runTo('home', { animate: false }));
  if (fromHash({ scroll: true }) && visible()) panel.focus({ preventScroll: true });

  stage.classList.add('is-ready');
}
