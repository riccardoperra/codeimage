export type SignatureTone = 'dark' | 'light';

type Rgb = readonly [number, number, number];

function channel(value: string, max: number) {
  const number = parseFloat(value);
  return value.trim().endsWith('%') ? (number / 100) * max : number;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

/** Every hex, `rgb()` and `hsl()` colour in a CSS background, in order. */
export function parseColors(background: string): Rgb[] {
  const tokens =
    background.match(/#[\da-f]{3,8}\b|(?:rgb|hsl)a?\([^)]*\)/gi) ?? [];
  return tokens.flatMap((token): Rgb[] => {
    if (token.startsWith('#')) {
      const hex = token.slice(1);
      const full =
        hex.length <= 4 ? [...hex].map(digit => digit + digit).join('') : hex;
      if (full.length !== 6 && full.length !== 8) return [];
      return [
        [
          parseInt(full.slice(0, 2), 16),
          parseInt(full.slice(2, 4), 16),
          parseInt(full.slice(4, 6), 16),
        ],
      ];
    }
    const parts = token
      .slice(token.indexOf('(') + 1, -1)
      .split(/[\s,/]+/)
      .filter(Boolean);
    if (parts.length < 3) return [];
    if (token.toLowerCase().startsWith('hsl')) {
      return [
        hslToRgb(
          parseFloat(parts[0]),
          channel(parts[1], 1) / (parts[1].endsWith('%') ? 1 : 100),
          channel(parts[2], 1) / (parts[2].endsWith('%') ? 1 : 100),
        ),
      ];
    }
    return [
      [channel(parts[0], 255), channel(parts[1], 255), channel(parts[2], 255)],
    ];
  });
}

/** WCAG relative luminance, 0 for black and 1 for white. */
export function luminance([r, g, b]: Rgb): number {
  const linear = (value: number) => {
    const s = Math.min(255, Math.max(0, value)) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * White ink stays on mid-tones and on gradients with a dark end, where it
 * reads better than black. Dark ink only where the whole fill is clearly light.
 */
export function toneOfLuminances(values: readonly number[]): SignatureTone {
  if (!values.length) return 'dark';
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return average > 0.4 || Math.min(...values) > 0.25 ? 'light' : 'dark';
}

export function toneOfBackground(background: string | null): SignatureTone {
  return toneOfLuminances(parseColors(background ?? '').map(luminance));
}
