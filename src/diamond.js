// The ballpark game layer (home page). Optional: without this file the bases are plain links.
// Three modes, shown in the game bar under the field:
// - bat (first visit): the pitcher throws, the visitor swings (click/tap the field, Space, "Swing!") → home run → tour
// - tour: the runner stops at each base for a small moment (zoom, high five, cheer) while the panel shows a preview
//   of the project; it moves on after TOUR_WAIT unless paused. Back / Pause / Next are always there.
// - free: click/tap a base or ← → and the runner runs there · Esc closes the panel · "Take another swing" starts again
// Sound (src/sound.js) is off until the visitor turns it on with the toggle in the game bar.
// The address shows the base (/#nipotyno): deep links (they skip the at-bat) and the browser Back button work.
// With reduced motion: no pitch, no zoom, no timer — the tour waits for Next.
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
  const TOUR_WAIT = 10000; // time on each base before the tour moves on (ms)
  const MOMENT = 2000; // zoom + high five / cheer / wave (ms)

  const bar = field.querySelector('.game-bar');
  const rows = Object.fromEntries([...bar.querySelectorAll('[data-mode]')].map((row) => [row.dataset.mode, row]));
  const button = (action) => bar.querySelector(`[data-mode="${action === 'swing' ? 'bat' : 'tour'}"] [data-action="${action}"]`);
  const status = bar.querySelector('[role="status"]');
  const stepLabel = bar.querySelector('.tour-step');
  const timer = bar.querySelector('.timer');
  const batting = atBat({
    stage, runner, pitcher: crew.pitcher, ball: stage.querySelector('.ball'), banner: stage.querySelector('.banner'), reduceMotion,
  });

  let mode = 'free';
  let current = 'home';
  let pos = { x: byId.home.x, y: byId.home.y };
  let running = null;
  // Tour state. `tourRun` changes on every new step, so a step that was left behind stops by itself.
  let step = 0;
  let tourRun = 0;
  let paused = false;
  let hold = false; // mouse on the panel or focus inside it: the timer waits
  let ticking = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const say = (text) => { status.textContent = text; };
  const stopName = (s) => (s.panel === 'done' ? "That's the tour" : byId[s.stop].name);

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
    if (mode === 'tour' && next !== 'tour') { tourRun++; stopTimer(); endMoment(); }
    mode = next;
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
    tourStep(0);
    refocus(button('next'));
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
  async function moment(s, run) {
    const base = byId[s.stop];
    const others = Object.keys(s.with).map((id) => crewAt[id]);
    const xs = [base.x, ...others.map((m) => m.x)];
    zoomOn({ x: (Math.min(...xs) + Math.max(...xs)) / 2, y: base.y - 14 });
    runner.classList.add(`is-${s.moment}`);
    sound.play(s.moment === 'highfive' ? 'clap' : 'cheer');
    for (const [id, anim] of Object.entries(s.with)) crew[id].classList.add(`is-${anim}`);
    await sleep(MOMENT);
    if (run === tourRun) endMoment();
  }

  function updateTourBar() {
    const last = step === TOUR.length - 1;
    stepLabel.textContent = `${step + 1} / ${TOUR.length} · ${stopName(TOUR[step])}`;
    button('back').disabled = step === 0;
    button('next').disabled = last;
    const timed = !reduceMotion.matches && !last;
    button('pause').hidden = !timed;
    timer.hidden = !timed;
    button('pause').textContent = paused ? 'Play' : 'Pause';
    button('pause').setAttribute('aria-label', paused ? 'Resume the tour' : 'Pause the tour');
  }

  function stopTimer() {
    cancelAnimationFrame(ticking);
    timer.style.setProperty('--done', 0);
  }

  // Count TOUR_WAIT on this base (only while not paused, not held and the tab is visible), then go on.
  function startTimer(run) {
    let waited = 0;
    let last = performance.now();
    const tick = (now) => {
      if (run !== tourRun) return;
      if (!paused && !hold && !document.hidden) waited += now - last;
      last = now;
      timer.style.setProperty('--done', Math.min(waited / TOUR_WAIT, 1));
      if (waited >= TOUR_WAIT) tourStep(step + 1);
      else ticking = requestAnimationFrame(tick);
    };
    ticking = requestAnimationFrame(tick);
  }

  async function tourStep(i, { push = true } = {}) {
    const run = ++tourRun;
    stopTimer();
    endMoment();
    step = i;
    const s = TOUR[i];
    if (push && location.hash !== `#${s.stop}`) history.pushState({ stop: s.stop }, '', `#${s.stop}`);
    updateTourBar();
    await runTo(s.stop, { panelId: s.panel ?? s.stop });
    if (run !== tourRun) return;
    say(`Tour ${i + 1} of ${TOUR.length}: ${stopName(s)}.`);
    if (s.moment && !reduceMotion.matches) {
      await moment(s, run);
      if (run !== tourRun) return;
    }
    if (i < TOUR.length - 1 && !reduceMotion.matches) startTimer(run);
  }

  panel.addEventListener('mouseenter', () => { hold = true; });
  panel.addEventListener('mouseleave', () => { hold = false; });
  panel.addEventListener('focusin', () => { hold = true; });
  panel.addEventListener('focusout', (event) => { if (!panel.contains(event.relatedTarget)) hold = false; });

  // --- Free running -----------------------------------------------------------

  function go(id, { focus = 'panel', history: push = true } = {}) {
    if (mode !== 'free') setMode('free');
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

  // --- Controls -----------------------------------------------------------------

  field.addEventListener('click', (event) => {
    sound.wake();
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'swing') swing();
    else if (action === 'next' && step < TOUR.length - 1) tourStep(step + 1);
    else if (action === 'back' && step > 0) tourStep(step - 1);
    else if (action === 'pause') { paused = !paused; updateTourBar(); }
    else if (action === 'sound') { sound.set(!sound.on); showSound(); }
    else if (action === 'free') {
      setMode('free');
      say('Free mode: click or tap a base.');
      refocus(links.find((l) => l.dataset.stop === current));
    } else if (action === 'again') {
      batUp();
      button('swing').focus({ preventScroll: true });
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

  // "Play ball!" on the Start screen: after the jump to the field, the Swing button has the focus.
  for (const play of document.querySelectorAll('a[href="#field"]')) {
    play.addEventListener('click', () => {
      if (mode === 'bat') requestAnimationFrame(() => button('swing').focus({ preventScroll: true }));
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
      panel.hidden = true;
      if (mode === 'tour') { paused = true; updateTourBar(); }
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

  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (!id) { if (mode !== 'bat') { setMode('free'); runTo('home', { animate: false }); } return; }
    if (!byId[id]) return; // other anchors (#field, #work…) are not bases
    const j = TOUR.findIndex((s) => s.stop === id && !s.panel);
    if (mode === 'tour' && j >= 0) { tourStep(j, { push: false }); return; }
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
