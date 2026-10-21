// The ballpark game layer (home page). Optional: without this file the bases are plain links.
// Three modes:
// - bat (first visit): the pitcher throws, the visitor swings (click/tap the field, Space, "Swing!") → home run → tour
// - tour: the runner stops at each project for a small moment (zoom, high five, cheer) while the card shows a preview.
//   NOTHING moves on by itself: the card has one main button ("Next base: Levante →") and a small "◀ Back";
//   the diamond in the corner of the field shows the bases visited; "✕ Exit tour" leaves it.
// - free: click/tap a base or ← → and the runner runs there · Esc closes the panel · "Take another swing" starts again
// Sound (src/sound.js) is off until the visitor turns it on with the toggle in the game bar.
// The address shows the base (/#nipotyno) and is only REPLACED, never added to: one Back press leaves the page.
// Deep links skip the at-bat. With reduced motion: no pitch and no zoom — the tour is the same, just without animation.
import { FIELD, STOPS, RING, CREW, TOUR } from './field-map.js';
import { atBat } from './batting.js';
import { sound } from './sound.js';

const stage = document.querySelector('.stage');
const field = document.querySelector('#field');
if (stage) start();

function start() {
  const runner = stage.querySelector('.runner');
  const panel = document.querySelector('#field-panel');
  const links = [...stage.querySelectorAll('.base')];
  const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]));
  const crewAt = Object.fromEntries(CREW.map((m) => [m.id, m]));
  const crew = Object.fromEntries([...stage.querySelectorAll('[data-crew]')].map((el) => [el.dataset.crew, el]));
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const SPEED = 110; // field pixels per second
  const MOMENT = 2000; // zoom + high five / cheer / wave (ms)
  const PROJECTS = TOUR.filter((s) => !s.panel).length; // stops that count in "2 of 4"

  const bar = field.querySelector('.game-bar');
  const rows = Object.fromEntries([...bar.querySelectorAll('[data-mode]')].map((row) => [row.dataset.mode, row]));
  const swingButton = bar.querySelector('[data-action="swing"]');
  const status = bar.querySelector('[role="status"]');
  const tourMap = stage.querySelector('.tour-map');
  const tourCount = tourMap.querySelector('.tour-count');
  const corners = [...tourMap.querySelectorAll('[data-corner]')];
  const batting = atBat({
    stage, runner, pitcher: crew.pitcher, ball: stage.querySelector('.ball'), banner: stage.querySelector('.banner'), reduceMotion,
  });

  let mode = 'free';
  let current = 'home';
  let pos = { x: byId.home.x, y: byId.home.y };
  let running = null;
  // Tour state. `tourRun` changes on every new step, so a step that was left behind stops by itself.
  // `shown` = the step whose card is on screen (Next and Back count from it).
  let shown = 0;
  let tourRun = 0;
  let visited = new Set();

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const say = (text) => { status.textContent = text; };
  const stopName = (s) => byId[s.stop].name;

  const place = ({ x, y }) => {
    runner.style.setProperty('--x', `${(Math.round(x) / FIELD.width) * 100}%`);
    runner.style.setProperty('--y', `${(Math.round(y) / FIELD.height) * 100}%`);
  };

  // Waypoints from one stop to another: along the base path (shortest way round), via home for the dugout.
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

  // Move the runner to `id`, then show `panelId` (the stop's own panel by default). Resolves on arrival.
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
      showPanel(panelId);
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
        else { running = null; stage.classList.remove('is-running'); showPanel(panelId); resolve(); }
      };
      running = { frame: requestAnimationFrame(tick) };
    });
  }

  function setMode(next) {
    if (mode === 'bat' && next !== 'bat') batting.stop();
    if (mode === 'tour' && next !== 'tour') { tourRun++; endMoment(); clearNav(); }
    mode = next;
    panel.dataset.mode = next; // CSS: in the tour the "Read the case study" link is the quiet button
    tourMap.hidden = next !== 'tour';
    for (const [name, row] of Object.entries(rows)) row.hidden = name !== next;
  }

  // Focus left on a button that just got hidden would fall back to the page: move it somewhere useful.
  function refocus(target) {
    const active = document.activeElement;
    if (active === document.body || (bar.contains(active) && active.closest('[hidden]'))) target.focus({ preventScroll: true });
  }

  // Replace (never add) the history entry, so the address can be shared and one Back press leaves the page.
  const setHash = (id) => { if (location.hash !== `#${id}`) history.replaceState({ stop: id }, '', `#${id}`); };

  // --- At bat ---------------------------------------------------------------

  function batUp() {
    setMode('bat');
    say('At bat. Swing to hit the pitch.');
    runTo('home').then(() => {
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
    visited = new Set();
    tourStep(0);
  }

  // --- Tour -------------------------------------------------------------------

  // Zoom 2× on a point (field pixels), kept inside the field.
  function zoomOn({ x, y }) {
    const clamp = (v) => Math.min(0, Math.max(-100, v));
    stage.style.setProperty('--tx', `${clamp(50 - (x / FIELD.width) * 200)}%`);
    stage.style.setProperty('--ty', `${clamp(50 - (y / FIELD.height) * 200)}%`);
    stage.classList.add('is-zoomed');
  }

  function endMoment() {
    stage.classList.remove('is-zoomed');
    runner.classList.remove('is-highfive', 'is-cheer', 'is-wave');
    for (const el of Object.values(crew)) el.classList.remove('is-highfive', 'is-cheer');
  }

  // The small moment on a base: zoom on the runner (and whoever joins in), animate, zoom back out.
  // It never blocks anything: Next and Back work while it plays (a new step ends it).
  async function moment(s, run) {
    const base = byId[s.stop];
    const others = Object.keys(s.with).map((id) => crewAt[id]);
    const xs = [base.x, ...others.map((m) => m.x)];
    zoomOn({ x: (Math.min(...xs) + Math.max(...xs)) / 2, y: base.y - 21 });
    runner.classList.add(`is-${s.moment}`);
    sound.play(s.moment === 'highfive' ? 'clap' : 'cheer');
    for (const [id, anim] of Object.entries(s.with)) crew[id].classList.add(`is-${anim}`);
    await sleep(MOMENT);
    if (run === tourRun) endMoment();
  }

  // The diamond in the corner: bases already visited are filled, the current one is highlighted.
  function showProgress(i) {
    const s = TOUR[i];
    if (s.panel) for (const t of TOUR) { if (t.corner) visited.add(t.corner); }
    else visited.add(s.corner);
    for (const el of corners) {
      el.classList.toggle('is-visited', visited.has(el.dataset.corner));
      el.classList.toggle('is-current', el.dataset.corner === s.corner);
    }
    tourCount.textContent = s.panel ? 'Tour complete' : `${i + 1} of ${PROJECTS} · ${stopName(s)}`;
    say(s.panel ? 'Tour complete.' : `Tour ${i + 1} of ${PROJECTS}: ${stopName(s)}.`);
  }

  function clearNav() {
    for (const nav of panel.querySelectorAll('.tour-nav')) nav.remove();
  }

  // The tour controls live inside the card the visitor is reading: one main button and a small Back.
  // They are made here, so the static page has none.
  function renderNav(i) {
    clearNav();
    const s = TOUR[i];
    const nav = document.createElement('div');
    nav.className = 'tour-nav';
    if (i < TOUR.length - 1) {
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'button';
      next.dataset.action = 'next';
      next.append(i === TOUR.length - 2 ? 'Finish the tour ' : `Next base: ${stopName(TOUR[i + 1])} `);
      next.insertAdjacentHTML('beforeend', '<span aria-hidden="true">→</span>');
      nav.append(next);
    }
    if (i > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'link';
      back.dataset.action = 'back';
      back.innerHTML = '<span aria-hidden="true">◀</span> Back';
      nav.append(back);
    }
    panel.querySelector(`[data-panel="${s.panel ?? s.stop}"]`).append(nav);
  }

  // After a step the focus goes to the new main button, so keyboard users can keep pressing Enter.
  // Only if the focus was not somewhere else on the page.
  function focusNav() {
    const active = document.activeElement;
    if (active !== document.body && !panel.contains(active) && !bar.contains(active)) return;
    const target = panel.querySelector('.tour-nav .button') ?? panel.querySelector('[data-panel]:not([hidden]) [data-action="again"]');
    target?.focus({ preventScroll: true });
  }

  async function tourStep(i) {
    const run = ++tourRun;
    endMoment();
    const s = TOUR[i];
    setHash(s.stop);
    await runTo(s.stop, { panelId: s.panel ?? s.stop });
    if (run !== tourRun) return;
    // On arrival, all at once: card, counter, diamond, controls.
    shown = i;
    showProgress(i);
    renderNav(i);
    focusNav();
    if (s.moment && !reduceMotion.matches) await moment(s, run);
  }

  // --- Free running -----------------------------------------------------------

  function go(id, { focus = 'panel' } = {}) {
    const wasTour = mode === 'tour';
    if (mode !== 'free') setMode('free');
    setHash(id);
    const arrived = runTo(id);
    const note = `${wasTour ? 'Tour ended. Free mode. ' : ''}${byId[id].name}, ${byId[id].label}.`;
    arrived.then(() => say(note));
    if (focus === 'base') links.find((l) => l.dataset.stop === id).focus();
    else arrived.then(() => panel.focus({ preventScroll: true }));
  }

  for (const link of links) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      go(link.dataset.stop);
    });
  }

  // --- Controls -----------------------------------------------------------------

  field.addEventListener('click', (event) => {
    sound.wake();
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'swing') swing();
    else if (action === 'next' && mode === 'tour' && shown < TOUR.length - 1) tourStep(shown + 1);
    else if (action === 'back' && mode === 'tour' && shown > 0) tourStep(shown - 1);
    else if (action === 'sound') { sound.set(!sound.on); showSound(); }
    else if (action === 'free') {
      setMode('free');
      say('Tour ended. Free mode.');
      refocus(links.find((l) => l.dataset.stop === current));
    } else if (action === 'again') {
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

  // "Play ball!" on the Start screen: scroll to the field and put the focus on Swing!.
  // Done here, not by the browser, because a link to #field would add a step to the history
  // (and then one Back press would not be enough to leave). Without JS it is a normal link.
  for (const play of document.querySelectorAll('a[href="#field"]')) {
    play.addEventListener('click', (event) => {
      event.preventDefault();
      field.scrollIntoView({ block: 'start' });
      if (mode === 'bat') swingButton.focus({ preventScroll: true });
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
      if (mode === 'tour') { setMode('free'); say('Tour ended. Free mode.'); }
      panel.hidden = true;
      history.replaceState(null, '', location.pathname + location.search);
      links.find((l) => l.dataset.stop === current).focus();
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
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (!id) { if (mode !== 'bat') { setMode('free'); runTo('home', { animate: false }); } return; }
    if (!byId[id]) { if (mode === 'tour') setMode('free'); return; } // #work, #about… are not bases
    setMode('free');
    runTo(id, { animate: false });
  });

  const soundToggle = bar.querySelector('[data-action="sound"]');
  const showSound = () => {
    soundToggle.setAttribute('aria-pressed', String(sound.on));
    soundToggle.querySelector('.state').textContent = sound.on ? 'on' : 'off';
  };
  showSound();
  bar.hidden = false;
  if (fromHash({ scroll: true })) {
    setMode('free');
    panel.focus({ preventScroll: true });
  } else {
    batUp();
  }
  stage.classList.add('is-ready');
}
