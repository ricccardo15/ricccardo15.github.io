// Remembers the uniform picked on the Start screen (per visitor, this browser only).
// The switch itself is CSS (radio + :has() in style.css): without this file it still works, just not remembered.
const KEY = 'uniform';
const radios = [...document.querySelectorAll('input[name="uniform"]')];

try {
  const saved = localStorage.getItem(KEY);
  const radio = radios.find((r) => r.value === saved);
  if (radio) radio.checked = true;
} catch { /* storage blocked (private window): keep the default */ }

for (const radio of radios) {
  radio.addEventListener('change', () => {
    try { localStorage.setItem(KEY, radio.value); } catch { /* ignore */ }
  });
}
