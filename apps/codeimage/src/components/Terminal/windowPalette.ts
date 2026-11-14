export interface WindowPaletteInput {
  background: string;
  text: string;
  accent?: string;
}

interface Color {
  r: number;
  g: number;
  b: number;
  a: number;
}

function parseColor(value: string): Color | undefined {
  const hex = /^#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})$/i.exec(value.trim())?.[1];
  if (hex) {
    const full = hex.length === 3 ? [...hex].map(c => c + c).join('') : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: full.length === 8 ? parseInt(full.slice(6), 16) / 255 : 1,
    };
  }
  const rgb = /^rgba?\(\s*([^()]+)\s*\)$/i.exec(value.trim())?.[1];
  if (!rgb) return undefined;
  const parts = rgb.trim().split(/[\s,/]+/);
  if (
    parts.length < 3 ||
    parts.length > 4 ||
    parts.some(part => !/^[-+]?(?:\d*\.)?\d+%?$/.test(part))
  )
    return undefined;
  const channel = (part: string) =>
    Math.max(
      0,
      Math.min(255, parseFloat(part) * (part.endsWith('%') ? 2.55 : 1)),
    );
  const alpha = parts[3] ?? '1';
  return {
    r: channel(parts[0]),
    g: channel(parts[1]),
    b: channel(parts[2]),
    a: Math.max(
      0,
      Math.min(1, parseFloat(alpha) / (alpha.endsWith('%') ? 100 : 1)),
    ),
  };
}

const rounded = (n: number) => Math.round(n * 10000) / 10000;
const rgb = (c: Color) =>
  `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
const rgba = (c: Color, opacity: number) =>
  `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${rounded(c.a * opacity)})`;
const mix = (base: Color, tint: Color, amount: number) => {
  const weight = amount * tint.a;
  return rgb({
    r: base.r * (1 - weight) + tint.r * weight,
    g: base.g * (1 - weight) + tint.g * weight,
    b: base.b * (1 - weight) + tint.b * weight,
    a: 1,
  });
};

export function createWindowPalette({
  background,
  text,
  accent = text,
}: WindowPaletteInput) {
  const ink = parseColor(text);
  const paper = parseColor(background);
  const tint = parseColor(accent);
  const inkAt = (alpha: number) => (ink ? rgba(ink, alpha) : text);
  const accentAt = (alpha: number) => (tint ? rgba(tint, alpha) : text);
  const tintedPaper = (amount: number) =>
    paper && tint ? mix(paper, tint, amount) : text;
  return {
    ink04: inkAt(0.04),
    ink08: inkAt(0.08),
    ink14: inkAt(0.14),
    ink20: inkAt(0.2),
    ink45: inkAt(0.45),
    ink62: inkAt(0.62),
    ink78: inkAt(0.78),
    ink90: inkAt(0.9),
    accent: tint ? rgba(tint, 1) : text,
    background: paper ? rgba(paper, 1) : text,
    status: tintedPaper(0.16),
    accent14: accentAt(0.14),
    accent22: accentAt(0.22),
    accent45: accentAt(0.45),
    accent55: accentAt(0.55),
    ambientBase: paper ? mix(paper, {r: 0, g: 0, b: 0, a: 1}, 0.18) : text,
  };
}

export function createAmbientBackground(
  palette: ReturnType<typeof createWindowPalette>,
): string {
  return `radial-gradient(70% 90% at 12% 8%, ${palette.accent55} 0%, rgba(0, 0, 0, 0) 62%), radial-gradient(70% 90% at 92% 96%, ${palette.accent45} 0%, rgba(0, 0, 0, 0) 62%), ${palette.ambientBase}`;
}
