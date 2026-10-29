// Title screen (F4): the menu is three real links, so it works without this file.
// This adds what a game menu does: ↑ ↓ move between the three modes (only while the focus is in the menu, no global keys),
// Enter opens one (the browser already does that for a link), and shows the hint for those keys.
// The ▶ cursor follows hover and focus in CSS (style.css, .title-menu).
const menu = document.querySelector('.title-menu');
if (menu) {
  const items = [...menu.querySelectorAll('a')];
  menu.addEventListener('keydown', (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    event.preventDefault();
    items[(i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
  });
  const hint = document.querySelector('.menu-hint');
  if (hint) hint.hidden = false;
}
