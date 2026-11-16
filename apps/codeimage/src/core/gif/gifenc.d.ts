declare module 'gifenc' {
  export type Palette = number[][];
  export function quantize(rgba: Uint8Array, colors: number): Palette;
  export function nearestColorIndex(palette: Palette, rgb: number[]): number;
  export function GIFEncoder(): {
    writeFrame(
      indexed: Uint8Array,
      width: number,
      height: number,
      options: {
        palette?: Palette;
        delay: number;
        dispose: number;
        transparent: boolean;
        repeat?: number;
      },
    ): void;
    finish(): void;
    bytes(): Uint8Array<ArrayBuffer>;
  };
}
