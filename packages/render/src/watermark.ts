export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export type WatermarkSlot =
  | 'header-right'
  | 'header-left'
  | 'content-right'
  | 'frame-bottom-right'
  | 'frame-bottom-left'
  | 'frame-top-right'
  | 'frame-top-left';

export interface WatermarkScene {
  readonly home: Rect;
  readonly window: Rect;
  readonly content: Rect;
  readonly header: Rect | null;
  readonly frame: {readonly bounds: Rect; readonly inset: number} | null;
  readonly code: readonly Rect[];
  readonly obstacles: readonly Rect[];
  readonly gap: number;
}

export type WatermarkPlacement =
  | {readonly slot: 'home' | 'unavoidable'}
  | {readonly slot: WatermarkSlot; readonly rect: Rect};

export function intersects(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

function contains(area: Rect, rect: Rect): boolean {
  return (
    rect.x >= area.x &&
    rect.y >= area.y &&
    rect.x + rect.width <= area.x + area.width &&
    rect.y + rect.height <= area.y + area.height
  );
}

export function placeWatermark(scene: WatermarkScene): WatermarkPlacement {
  if (!scene.code.some(rect => intersects(scene.home, rect)))
    return {slot: 'home'};

  const {width, height} = scene.home;
  const gap = scene.gap;
  const at = (x: number, y: number): Rect => ({x, y, width, height});
  const candidates: {
    slot: WatermarkSlot;
    rect: Rect;
    area: Rect;
    outside: boolean;
  }[] = [];
  if (scene.frame) {
    const area = scene.frame.bounds;
    const inset = scene.frame.inset;
    for (const bottom of [true, false]) {
      for (const right of [true, false]) {
        const slot = bottom
          ? right
            ? 'frame-bottom-right'
            : 'frame-bottom-left'
          : right
            ? 'frame-top-right'
            : 'frame-top-left';
        candidates.push({
          slot,
          rect: at(
            right ? area.x + area.width - width - inset : area.x + inset,
            bottom ? area.y + area.height - height - inset : area.y + inset,
          ),
          area,
          outside: true,
        });
      }
    }
  }
  candidates.push({
    slot: 'content-right',
    rect: at(
      scene.content.x + scene.content.width - width - gap * 2,
      scene.content.y + gap,
    ),
    area: scene.content,
    outside: false,
  });
  if (scene.header) {
    const area = scene.header;
    for (const right of [true, false]) {
      candidates.push({
        slot: right ? 'header-right' : 'header-left',
        rect: at(
          right ? area.x + area.width - width - gap * 2 : area.x + gap * 2,
          area.y + (area.height - height) / 2,
        ),
        area,
        outside: false,
      });
    }
  }
  const occupied = [...scene.code, ...scene.obstacles];
  for (const candidate of candidates) {
    if (!contains(candidate.area, candidate.rect)) continue;
    const clear = {
      x: candidate.rect.x - gap,
      y: candidate.rect.y - gap,
      width: width + gap * 2,
      height: height + gap * 2,
    };
    if (candidate.outside && intersects(clear, scene.window)) continue;
    if (occupied.some(rect => intersects(clear, rect))) continue;
    return {slot: candidate.slot, rect: candidate.rect};
  }
  return {slot: 'unavoidable'};
}
