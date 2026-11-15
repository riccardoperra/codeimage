import {
  EASING_CURVES,
  type Easing,
  type EasingCurve,
  type EasingName,
  type EasingValue,
} from './model';

const clamp = (value: number) => Math.min(1, Math.max(0, value));
export const formatPoint = (value: number) =>
  String(Number(clamp(value).toFixed(3)));
const isPreset = (value: string): value is EasingName =>
  Object.hasOwn(EASING_CURVES, value);

export function curveOf(easing: Easing): EasingCurve {
  const curve = typeof easing === 'string' ? EASING_CURVES[easing] : easing;
  return [clamp(curve[0]), clamp(curve[1]), clamp(curve[2]), clamp(curve[3])];
}

export function formatEasing(curve: EasingCurve): EasingValue {
  const points = curve.map(point => Number(formatPoint(point)));
  for (const [name, preset] of Object.entries(EASING_CURVES)) {
    if (
      isPreset(name) &&
      preset.every((point, index) => point === points[index])
    )
      return name;
  }
  return `cubic-bezier(${points.join(', ')})`;
}

export function parseEasing(text: string): EasingValue | null {
  const value = text.trim();
  if (isPreset(value)) return value;
  const body =
    value.startsWith('cubic-bezier(') && value.endsWith(')')
      ? value.slice(13, -1)
      : value;
  const parts = body.split(',').map(part => part.trim());
  if (
    parts.length !== 4 ||
    parts.some(
      part => !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(part),
    )
  )
    return null;
  const [x1, y1, x2, y2] = parts.map(Number);
  if (
    ![x1, y1, x2, y2].every(Number.isFinite) ||
    x1 < 0 ||
    x1 > 1 ||
    x2 < 0 ||
    x2 > 1
  )
    return null;
  return formatEasing([x1, y1, x2, y2]);
}

export function easingOf(value: EasingValue): Easing {
  if (isPreset(value)) return value;
  const [x1, y1, x2, y2] = value.slice(13, -1).split(',').map(Number);
  return [x1, y1, x2, y2];
}
