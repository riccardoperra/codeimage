const controllers = new WeakMap<HTMLElement, () => void>();

export function registerWatermark(anchor: HTMLElement, measure: () => void) {
  controllers.set(anchor, measure);
  return () => controllers.delete(anchor);
}

export async function prepareWatermarks(root: HTMLElement) {
  const anchors = Array.from(
    root.querySelectorAll<HTMLElement>('[data-watermark-home]'),
  );
  if (!anchors.length) return;
  await document.fonts.ready;
  await new Promise<void>(resolve =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );
  for (const anchor of anchors) controllers.get(anchor)?.();
}
