// The three uniforms of the Start screen. One source for the art (scripts/art/runner.js) and the home page.
// A uniform changes the look (palette swap + accessory), the skills shown and a suggested case.
// It never changes the order of the cases: the game never decides the content.
// `row` = row of the uniform in public/game/runner.png (48 px each).
export const UNIFORMS = [
  {
    id: 'researcher',
    label: 'Researcher',
    row: 0,
    colors: { helmet: 'navy', helmetLight: 'navyMid', helmetShade: 'navyDark', jersey: 'navy', jerseyLight: 'navyMid', jerseyShade: 'navyDark', number: 'red' },
    accessory: 'lens',
    skills: ['Interviews', 'Contextual inquiry', 'Qualitative coding', 'Usability testing (SUS, UEQ)'],
    suggested: 'housing',
  },
  {
    id: 'designer',
    label: 'Designer',
    row: 1,
    colors: { helmet: 'red', helmetLight: 'redLight', helmetShade: 'redDark', jersey: 'red', jerseyLight: 'redLight', jerseyShade: 'redDark', number: 'navy' },
    accessory: 'pencil',
    skills: ['Personas & journey maps', 'Wireflows', 'Figma prototypes', 'WCAG 2.2'],
    suggested: 'nipotyno',
  },
  {
    id: 'maker',
    label: 'Maker',
    row: 2,
    colors: { helmet: 'navy', helmetLight: 'navyMid', helmetShade: 'navyDark', jersey: 'grey', jerseyLight: 'greyLight', jerseyShade: 'greyDark', number: 'navy' },
    accessory: 'wrench',
    skills: ['HTML/CSS/JS', 'React', 'Arduino & sensors', 'Business models'],
    suggested: 'levante',
  },
];
