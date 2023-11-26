export class FontMetrics {
  #fontMetricsCanvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D;

  constructor() {
    this.#fontMetricsCanvas = document.createElement('canvas');
    const context = this.#fontMetricsCanvas?.getContext('2d');
    if (!context) {
      throw new Error('Cannot create CanvasRenderingContext2D');
    }
    this.context = context;
  }

  for(fontName: string) {
    const {context} = this;
    return new FontMetricsWithContext(context, fontName);
  }

  destroy(): void {
    this.#fontMetricsCanvas?.remove();
    this.#fontMetricsCanvas = null;
  }
}

export class FontMetricsWithContext {
  constructor(
    private readonly context: CanvasRenderingContext2D,
    private readonly fontName: string,
  ) {
    context.font = `16px ${this.fontName}`;
  }

  charWidth(char: string) {
    return this.context.measureText(char);
  }
}
