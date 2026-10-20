// Remembers the uniform picked on the Start screen (per visitor, this browser only).
// The switch itself is CSS (radio + :has() in style.css): without this file it still works, just not remembered.
// On a change the big batter swings once, as feedback.
const KEY = 'uniform';
const radios = [...document.querySelectorAll('input[name="uniform"]')];
const batter = document.querySelector('.batter');

try {
  const saved = localStorage.getItem(KEY);
  const radio = radios.find((r) => r.value === saved);
  if (radio) radio.checked = true;
} catch { /* storage blocked (private window): keep the default */ }

for (const radio of radios) {
  radio.addEventListener('change', () => {
    try { localStorage.setItem(KEY, radio.value); } catch { /* ignore */ }
    // A swing in the new uniform (CSS; no animation with reduced motion).
    batter.classList.remove('is-swinging');
    void batter.offsetWidth; // restart the animation if it is still running
    batter.classList.add('is-swinging');
  });
}
batter.addEventListener('animationend', () => batter.classList.remove('is-swinging'));
