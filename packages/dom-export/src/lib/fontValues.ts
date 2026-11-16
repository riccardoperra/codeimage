const REGEXP_QUOTE_FONT_FAMILY = /^['"]|['"]$/g;

export const getFontName = (fontFamily: string) => {
  if (!fontFamily) {
    console.warn('[dom-export] Given font-family value is invalid');
    return [];
  }
  const fonts = fontFamily.split(',');
  return fonts.map(font =>
    font.trim().toLowerCase().replace(REGEXP_QUOTE_FONT_FAMILY, ''),
  );
};

function weightOf(weight: string) {
  if (weight === 'bold') return 700;
  if (!weight || weight === 'normal') return 400;
  return Number(weight);
}

export function matchesFontFace(
  id: string,
  face: {family: string; fontWeight: string; fontStyle: string},
) {
  const {family, fontWeight, fontStyle} = face;
  const [minimum, maximum = minimum] = (fontWeight || '400')
    .split(/\s+/)
    .map(weightOf);
  const prefix = `${family}-`;
  if (!id.startsWith(prefix)) return false;
  const [weight, style] = id.slice(prefix.length).split('-');
  return (
    weightOf(weight) >= minimum &&
    weightOf(weight) <= maximum &&
    (style || 'normal') === (fontStyle || 'normal')
  );
}
