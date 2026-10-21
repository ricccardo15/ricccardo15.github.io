// The points of the stadium that are not bases (SPOTS in src/field-map.js):
//   scoreboard → About · pitcher's mound → How I design · ticket booth → Contact & CV
// A click opens their card over the stadium; the runner stays where he is and the address does not change.
// The same links are in the "Stadium map" list under the field. Without JS they jump to the sections of the page.
export function createSpots({ field, openSpot }) {
  for (const link of field.querySelectorAll('[data-spot]')) {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openSpot(link.dataset.spot, link);
    });
  }
}
