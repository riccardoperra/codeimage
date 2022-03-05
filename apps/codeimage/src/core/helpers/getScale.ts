export function getScaleByRatio(
  parent: HTMLElement | undefined | null,
  child: HTMLElement | undefined | null,
  offset = 1,
): number {
  if (!parent || !child) {
    return 1;
  }

  if (
    child.clientWidth > parent.clientWidth &&
    child.clientHeight > parent.clientHeight
  ) {
    const hRatio = parent.clientWidth / child.clientWidth;
    const vRatio = parent.clientHeight / child.clientHeight;
    return Math.min(hRatio, vRatio) / offset;
  } else {
    if (child.clientHeight > parent.clientHeight) {
      return parent.clientHeight / child.clientHeight / offset;
    }

    if (child.clientWidth > parent.clientWidth) {
      return parent.clientWidth / child.clientWidth / offset;
    }
  }
  return 1;
}
