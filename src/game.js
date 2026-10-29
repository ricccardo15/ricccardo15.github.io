// The ballpark game layer (home page). Optional: without this file the bases are plain links.
// Three modes:
// - bat (first visit): the pitcher throws, the visitor swings (click/tap the field, Space, "Swing!") → home run → tour
// - tour: src/tour.js — one project per base, nothing moves on by itself ("Next base" / "◀ Back" in the card)
// - free: click/tap a base or ← → and the runner runs there · Esc closes the panel · "Take another swing" starts again
// Every point opens its card over the stadium (src/spots.js for the scoreboard, the mound and the ticket booth):
// a drawer on the right on desktop, under the stage on phones; ✕ Close or Esc close it and the focus goes back to the point.
// Sound (src/sound.js) is off until the visitor turns it on with the toggle in the game bar.
// The address shows the base (/#nipotyno) and is only REPLACED, never added to: one Back press leaves the page.
// Deep links skip the at-bat. With reduced motion: no pitch and no zoom — the tour is the same, just without animation.
import { FIELD, STOPS, SPOTS, RING, CREW, DUGOUT } from './field-map.js';
import { atBat } from './batting.js';
import { sound } from './sound.js';
import { createTour } from './tour.js';
import { createSpots } from './spots.js';
import './reader.js';
import { T } from './strings.js'; // the sentences in the page's language // the case reader (its popstate runs first and marks the events it handles)

const stage = document.querySelector('.stage');
const field = document.querySelector('#field');
if (stage) start();

function start() {
  const runner = stage.querySelector('.runner');
  const panel = document.querySelector('#field-panel');
  const links = [...stage.querySelectorAll('.base[data-stop]')];
  const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));
  const spotById = Object.fromEntries(SPOTS.map((s) => [s.id, s]));
  const fieldBox = stage.querySelector('.field-box');
  const swingBox = stage.querySelector('.swing-box');
  const closeButton = panel.querySelector('[data-action="close"]');
  const wide = matchMedia('(min-width: 1000px)'); // the card is a drawer over the stage from here up
  const crewAt = Object.fromEntries(CREW.map((m) => [m.id, m]));
  const crew = Object.fromEntries([...stage.querySelectorAll('[data-crew]')].map((el) => [el.dataset.crew, el]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const SPEED = 110; // field pixels per second

  const bar = field.querySelector('.game-bar');
  const rows = Object.fromEntries([...bar.querySelectorAll('[data-mode]')].map((row) => [row.dataset.mode, row]));
  const swingButton = field.querySelector('[data-action="swing"]');
  const status = bar.querySelector('[role="status"]');
  const batting = atBat({
    stage, runner, pitcher: crew.pitcher, ball: stage.querySelector('.ball'), banner: stage.querySelector('.banner'), reduceMotion,
  });

  let mode = 'free';
  let current = 'home';
  let pos = { x: byId.home.x, y: byId.home.y };
  let running = null;
  let opener = null; // the link that opened the card: the focus goes back to it on close
  let looking = null; // the point the card is about (for the camera)

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const say = (text) => { status.textContent = text; };
  // Names and labels as written on the page (already in its language): "Levante", "2nd base".
  const textOf = (attr, id, part) => field.querySelector(`.base[data-${attr}="${id}"] .base-${part}`).textContent;
  const nameOf = (id) => textOf('stop', id, 'name');

  const place = ({ x, y }) => {
    runner.style.setProperty('--x', `${(Math.round(x) / FIELD.width) * 100}%`);
    runner.style.setProperty('--y', `${(Math.round(y) / FIELD.height) * 100}%`);
  };

  // Waypoints from one stop to another: along the base path (shortest way round), out of the dugout via home.
  function route(from, to) {
    const ringPath = (a, b) => {
      const i = RING.indexOf(a), j = RING.indexOf(b), n = RING.length;
      const forward = (j - i + n) % n;
      const dir = forward <= n - forward ? 1 : -1;
      const path = [];
      for (let k = i; k !== j; ) { k = (k + dir + n) % n; path.push(RING[k]); }
      return path;
    };
    if (from === to) return [];
    if (from === 'dugout') return ['home', ...ringPath('home', to)];
    return ringPath(from, to);
  }

  // The camera: on desktop the card covers the right of the stage, so the picture slides left until the point is clear.
  function camera(point) {
    looking = point;
    let shift = 0;
    if (point && wide.matches && !panel.hidden) {
      const scale = fieldBox.clientWidth / FIELD.width;
      const covered = stage.getBoundingClientRect().right - panel.getBoundingClientRect().left;
      shift = Math.max(0, point.x * scale - (stage.clientWidth - covered - 110)); // 110 px: room for the point's label too
    }
    fieldBox.style.setProperty('--cam', `${-Math.round(shift)}px`);
  }
  addEventListener('resize', () => camera(looking));

  function showPanel(id) {
    panel.hidden = false;
    for (const card of panel.querySelectorAll('[data-panel]')) card.hidden = card.dataset.panel !== id;
    camera(spotById[id] ?? byId[id] ?? byId[current]);
  }

  function closePanel({ focus = true } = {}) {
    panel.hidden = true;
    camera(null);
    if (focus) (opener ?? links.find((l) => l.dataset.stop === current)).focus({ preventScroll: true });
  }

  function mark(id) {
    for (const link of field.querySelectorAll('[data-stop]')) {
      if (link.dataset.stop === id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  // Move the runner to `id`, then show `panelId` (the stop's own panel by default; null = no card). Resolves on arrival.
  function runTo(id, { animate = true, panelId = id } = {}) {
    if (running) cancelAnimationFrame(running.frame);
    const stops = route(current, id).map((s) => byId[s]);
    current = id;
    mark(id);
    if (!animate || reduceMotion.matches || !stops.length) {
      running = null;
      stage.classList.remove('is-running');
      pos = { x: byId[id].x, y: byId[id].y };
      place(pos);
      if (panelId) showPanel(panelId);
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
          if (dx) runner.classList.toggle('is-flipped', dx < 0);
        }
        place(pos);
        if (stops.length) running.frame = requestAnimationFrame(tick);
        else { running = null; stage.classList.remove('is-running'); if (panelId) showPanel(panelId); resolve(); }
      };
      running = { frame: requestAnimationFrame(tick) };
    });
  }

  // Replace (never add) the history entry, so the address can be shared and one Back press leaves the page.
  const setHash = (id) => { if (location.hash !== `#${id}`) history.replaceState({ stop: id }, '', `#${id}`); };

  const tour = createTour({ stage, panel, bar, runner, crew, crewAt, byId, nameOf, reduceMotion, sound, sleep, say, setHash, runTo });

  function setMode(next) {
    if (mode === 'bat' && next !== 'bat') batting.stop();
    if (mode === 'tour' && next !== 'tour') tour.stop();
    mode = next;
    panel.dataset.mode = next; // CSS: in the tour the "Read the case study" link is the quiet button
    tour.show(next === 'tour');
    swingBox.hidden = next !== 'bat';
    for (const [name, row] of Object.entries(rows)) row.hidden = name !== next;
  }

  // Focus left on a button that just got hidden would fall back to the page: move it somewhere useful.
  function refocus(target) {
    const active = document.activeElement;
    if (active === document.body || (bar.contains(active) && active.closest('[hidden]'))) target.focus({ preventScroll: true });
  }

  // --- At bat ---------------------------------------------------------------

  function batUp() {
    setMode('bat');
    say(T.atBat);
    runTo('home', { panelId: null }).then(() => {
      if (mode !== 'bat') return;
      runner.classList.remove('is-flipped');
      batting.start();
    });
  }

  async function swing() {
    if (mode !== 'bat' || !batting.active) return;
    await batting.swing();
    if (mode !== 'bat') return;
    setMode('tour');
    tour.start();
  }

  // --- Free running -----------------------------------------------------------

  function go(id, { focus = 'panel', from = null } = {}) {
    const wasTour = mode === 'tour';
    opener = from ?? links.find((l) => l.dataset.stop === id);
    if (mode !== 'free') setMode('free');
    setHash(id);
    const arrived = runTo(id);
    const note = `${wasTour ? `${T.tourEnded} ` : ''}${nameOf(id)}, ${textOf('stop', id, 'label')}.`;
    arrived.then(() => say(note));
    if (focus === 'base') links.find((l) => l.dataset.stop === id).focus();
    else arrived.then(() => panel.focus({ preventScroll: true }));
  }

  // Bases on the field and in the "Stadium map" list
  for (const link of field.querySelectorAll('[data-stop]')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      go(link.dataset.stop, { from: link });
    });
  }

  // Scoreboard, mound, ticket booth: their card opens, the runner stays. In the tour, that ends the tour.
  function openSpot(id, from) {
    const wasTour = mode === 'tour';
    if (wasTour) setMode('free');
    opener = from;
    showPanel(id);
    say(`${wasTour ? `${T.tourEnded} ` : ''}${textOf('spot', id, 'name')}.`);
    panel.focus({ preventScroll: true });
  }
  createSpots({ field, openSpot });

  // --- Controls -----------------------------------------------------------------

  field.addEventListener('click', (event) => {
    sound.wake();
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'swing') swing();
    else if (action === 'next' && mode === 'tour') tour.next();
    else if (action === 'back' && mode === 'tour') tour.back();
    else if (action === 'sound') { sound.set(!sound.on); showSound(); }
    else if (action === 'close') {
      if (mode === 'tour') { setMode('free'); say(T.tourEnded); }
      closePanel();
    }
    else if (action === 'free') {
      setMode('free');
      say(T.tourEnded);
      refocus(links.find((l) => l.dataset.stop === current));
    } else if (action === 'again') {
      closePanel({ focus: false });
      batUp();
      swingButton.focus({ preventScroll: true });
    } else if (mode === 'bat' && event.target.closest('.stage') && !event.target.closest('.base')) swing();
  });

  // Space swings while the field is on screen (not when typing or on another control).
  document.addEventListener('keydown', (event) => {
    if (mode !== 'bat' || event.key !== ' ' || event.target.closest('a, button, input, textarea, select, [contenteditable]')) return;
    const box = stage.getBoundingClientRect();
    if (box.bottom < 0 || box.top > innerHeight) return;
    event.preventDefault();
    sound.wake();
    swing();
  });

  // "Enter the ballpark" in the lobby: scroll to the stadium; the runner comes out of the dugout and walks to home plate,
  // then the pitches start and Swing! has the focus. Done here, not by the browser, because a link to #field would add a
  // step to the history (and then one Back press would not be enough to leave). Without JS it is a normal link.
  function entrance() {
    batting.stop();
    current = 'dugout'; // not a stop (no link, no card): only where the runner comes from
    pos = { ...DUGOUT };
    place(pos);
    batUp();
  }
  for (const enter of document.querySelectorAll('a[href="#field"]')) {
    enter.addEventListener('click', (event) => {
      event.preventDefault();
      field.scrollIntoView({ block: 'start' });
      if (mode === 'bat') {
        entrance();
        swingButton.focus({ preventScroll: true });
      }
    });
  }

  field.addEventListener('keydown', (event) => {
    const index = STOPS.findIndex((s) => s.id === current);
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      if (!event.target.closest('.stage, .panel')) return;
      event.preventDefault();
      const dir = event.key === 'ArrowRight' ? 1 : -1;
      go(STOPS[(index + dir + STOPS.length) % STOPS.length].id, { focus: 'base' });
    } else if (event.key === 'Escape' && !panel.hidden) {
      // Esc closes the card; in the tour that also ends it (without its card there are no tour controls).
      if (mode === 'tour') { setMode('free'); say(T.tourEnded); }
      history.replaceState(null, '', location.pathname + location.search);
      closePanel();
    }
  });

  // --- Address bar: deep links and Back/Forward -----------------------------------

  const fromHash = ({ scroll }) => {
    const id = location.hash.slice(1);
    if (!byId[id]) return false;
    runTo(id, { animate: false });
    if (scroll) {
      // Chrome keeps the page pinned to the #id target while images load, undoing our scroll:
      // the field is the deep-link view, so take the id off the list card.
      const card = document.getElementById(id);
      if (card && !field.contains(card)) { card.dataset.id = id; card.removeAttribute('id'); }
      const toField = () => requestAnimationFrame(() => field.scrollIntoView({ block: 'start' }));
      if (document.readyState === 'complete') toField();
      else window.addEventListener('load', toField, { once: true });
    }
    return true;
  };

  // Only other anchors (#work, #about…) or an address that was typed can add history entries now,
  // so Back/Forward here simply means "free mode" at whatever the address says.
  window.addEventListener('popstate', (event) => {
    if (event.readerHandled) return; // the case reader was opened or closed: the stadium stays as it is
    const id = location.hash.slice(1);
    if (!id) { if (mode !== 'bat') { setMode('free'); runTo('home', { animate: false }); } return; }
    if (!byId[id]) { if (mode === 'tour') setMode('free'); return; } // #work, #about… are not bases
    setMode('free');
    runTo(id, { animate: false });
  });

  const soundToggle = bar.querySelector('[data-action="sound"]');
  const showSound = () => {
    soundToggle.setAttribute('aria-pressed', String(sound.on));
    soundToggle.querySelector('.state').textContent = sound.on ? T.on : T.off;
  };
  showSound();
  bar.hidden = false;
  closeButton.hidden = false;
  panel.hidden = true; // the card opens when a point is clicked (or by the tour): at first the whole field is free to bat
  if (fromHash({ scroll: true })) {
    setMode('free');
    panel.focus({ preventScroll: true });
  } else {
    batUp();
  }
  stage.classList.add('is-ready');
  field.classList.add('is-live'); // CSS: the card goes over the stadium (desktop) only with the game running
}
