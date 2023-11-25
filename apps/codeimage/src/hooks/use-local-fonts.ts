declare global {
  interface Window {
    /**
     * query local fonts
     *
     * {@link https://developer.mozilla.org/en-US/docs/Web/API/Window/queryLocalFonts MDN Reference}
     */
    queryLocalFonts?: (options?: {
      postscriptNames: string[];
    }) => Promise<FontData[]>;
  }

  interface FontData {
    /**
     * the family of the font face
     */
    readonly family: string;
    /**
     * the full name of the font face
     */
    readonly fullName: string;
    /**
     * the PostScript name of the font face
     */
    readonly postscriptName: string;
    /**
     * the style of the font face
     */
    readonly style: string;
    /**
     * get a Promise that fulfills with a Blob containing the raw bytes of the underlying font file
     */
    readonly blob: () => Promise<Blob>;
  }
}

export async function useLocalFonts(): Promise<Record<string, FontData[]>> {
  const {queryLocalFonts} = window;
  if (!queryLocalFonts) {
    return {};
  }
  const fonts: Record<string, FontData[]> = {};
  const styleSheet = new CSSStyleSheet();
  try {
    const pickedFonts = await queryLocalFonts();
    console.log(pickedFonts);
    for (const metadata of pickedFonts) {
      if (!fonts[metadata.family]) {
        fonts[metadata.family] = [];
      }
      fonts[metadata.family].push(metadata);
    }
  } catch (err) {
    console.warn(err.name, err.message);
  }
  console.log(fonts);
  return fonts;
}

export async function checkLocalFontPermission() {
  const {navigator} = window;
  return navigator.permissions.query({
    name: 'local-fonts',
  } as unknown as PermissionDescriptor);
}

export async function revokeLocalFontPermission() {
  const {navigator} = window;
  return navigator.permissions.query({
    name: 'local-fonts',
  } as unknown as PermissionDescriptor);
}
