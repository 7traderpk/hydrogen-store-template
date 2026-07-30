// Every builder node carries {desktop, tablet, mobile} visibility flags -
// translate that into utility classes handled by CSS media queries (see
// app/styles/app.css "page builder" section), rather than inline display
// rules that would be harder to override responsively.
export function visibilityClass(visibility) {
  if (!visibility) return '';
  const classes = [];
  if (visibility.desktop === false) classes.push('pb-hide-desktop');
  if (visibility.tablet === false) classes.push('pb-hide-tablet');
  if (visibility.mobile === false) classes.push('pb-hide-mobile');
  return classes.join(' ');
}
