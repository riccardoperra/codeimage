import {
  determineFontFaceName,
  isMonospaced,
} from '@core/modules/localFontAccessApi/font';
import {FontMetrics} from '@core/modules/localFontAccessApi/fontMetrics';

export interface LoadedFont {
  family: string;
  faces: string[];
  monospaced: boolean;
}

export async function useLocalFonts(): Promise<LoadedFont[]> {
  const {queryLocalFonts} = window;
  if (!queryLocalFonts) {
    return [];
  }
  const fonts: Record<string, LoadedFont> = {};
  // TODO: use `using` with newer versions of typescript?
  const fontMetrics = new FontMetrics();
  try {
    const pickedFonts = await queryLocalFonts();
    for (const localFont of pickedFonts) {
      let fontData: LoadedFont = fonts[localFont.family];
      if (!fontData) {
        const metrics = fontMetrics.for(localFont.family);
        const monospaced = isMonospaced(metrics);
        fontData = {
          family: localFont.family,
          faces: [],
          monospaced,
        };
        fonts[localFont.family] = fontData;
      }
      const face = determineFontFaceName(localFont.style);
      if (face && !fontData.faces.includes(face)) {
        fontData.faces.push(face);
      }
    }
    Object.values(fonts).forEach(font => {
      font.faces.sort();
    });
  } catch (err) {}
  fontMetrics.destroy();
  return Object.values(fonts);
}
