// The home-run tour (started by src/game.js after the home run): one project per stop, each with a small moment
// (zoom, high five, cheer, wave) while the card shows a preview. NOTHING moves on by itself: the card has one main
// button ("Next base: Levante →") and a small "◀ Back"; the HUD on top shows the base and the bases visited (game.js).
// With reduced motion there is no zoom and no animation: the tour is the same, just still.
import { FIELD, TOUR } from './field-map.js';
import { T, fill } from './strings.js';

const MOMENT = 2000; // zoom + high five / cheer / wave (ms)
const PROJECTS = TOUR.filter((s) => !s.panel).length; // stops that count in "2 of 3"

// ctx (from game.js): stage, panel, bar, runner, crew, crewAt, byId, nameOf, reduceMotion, sound, sleep, say, setHash, runTo, done
export function createTour(ctx) {
  const { stage, panel, bar, runner, crew, crewAt, byId, reduceMotion, sound } = ctx;
  // `run` changes on every new step, so a step that was left behind stops by itself.
  // `shown` = the step whose card is on screen (Next and Back count from it).
  let shown = 0;
  let run = 0;

  const stopName = (s) => ctx.nameOf(s.stop);

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
  async function moment(s, mine) {
    const base = byId[s.stop];
    const others = Object.keys(s.with).map((id) => crewAt[id]);
    const xs = [base.x, ...others.map((m) => m.x)];
    zoomOn({ x: (Math.min(...xs) + Math.max(...xs)) / 2, y: base.y - 21 });
    runner.classList.add(`is-${s.moment}`);
    sound.play(s.moment === 'highfive' ? 'clap' : 'cheer');
    for (const [id, anim] of Object.entries(s.with)) crew[id].classList.add(`is-${anim}`);
    await ctx.sleep(MOMENT);
    if (mine === run) endMoment();
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
      next.append(`${i === TOUR.length - 2 ? T.finish : fill(T.nextBase, { name: stopName(TOUR[i + 1]) })} `);
      next.insertAdjacentHTML('beforeend', '<span aria-hidden="true">→</span>');
      nav.append(next);
    }
    if (i > 0) {
      const back = document.createElement('button');
      back.type = 'button';
      back.className = 'link';
      back.dataset.action = 'back';
      back.innerHTML = '<span aria-hidden="true">◀</span> ';
      back.append(T.back);
      nav.append(back);
    }
    const card = panel.querySelector(`[data-panel="${s.panel ?? s.stop}"]`);
    const links = card.querySelector('.card-links');
    if (links) links.after(nav); // right under "Read the case study": on screen without scrolling the card
    else card.append(nav);
  }

  // After a step the focus goes to the new main button, so keyboard users can keep pressing Enter.
  // Only if the focus was not somewhere else on the page.
  function focusNav() {
    const active = document.activeElement;
    if (active !== document.body && !panel.contains(active) && !bar.contains(active) && !stage.contains(active)) return;
    const target = panel.querySelector('.tour-nav .button') ?? panel.querySelector('[data-panel]:not([hidden]) .button');
    target?.focus({ preventScroll: true });
  }

  async function step(i) {
    const mine = ++run;
    endMoment();
    const s = TOUR[i];
    ctx.setHash(s.stop);
    await ctx.runTo(s.stop, { panelId: s.panel ?? s.stop });
    if (mine !== run) return;
    // On arrival, all at once: card, HUD, controls.
    shown = i;
    if (s.panel) {
      ctx.done();
      ctx.say(`${T.tourDone}.`);
    } else {
      ctx.say(fill(T.countSay, { i: i + 1, n: PROJECTS, name: stopName(s) }));
    }
    renderNav(i);
    focusNav();
    if (s.moment && !reduceMotion.matches) await moment(s, mine);
  }

  return {
    start() { step(0); },
    next() { if (shown < TOUR.length - 1) step(shown + 1); },
    back() { if (shown > 0) step(shown - 1); },
    // Leaving the tour: whatever was still going on stops, the controls go away.
    stop() { run++; endMoment(); clearNav(); },
  };
}
