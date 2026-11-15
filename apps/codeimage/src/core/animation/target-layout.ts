import type {Size} from './model';
import type {WindowPlacement} from './timeline';

export function targetLayout(
  viewport: Size,
  natural: Size,
  origin = {x: 0, y: 0},
): WindowPlacement {
  const scale = Math.min(
    1,
    viewport.width / natural.width,
    viewport.height / natural.height,
  );
  return {
    ...natural,
    scale,
    left: origin.x + (viewport.width - natural.width * scale) / 2,
    top: origin.y + (viewport.height - natural.height * scale) / 2,
  };
}
