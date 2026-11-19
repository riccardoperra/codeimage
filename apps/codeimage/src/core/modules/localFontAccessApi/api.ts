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

export function isLocalFontsFeatureSupported() {
  const {queryLocalFonts} = window;
  return !!queryLocalFonts;
}

export async function checkLocalFontPermission() {
  const {navigator} = window;
  return navigator.permissions.query({
    name: 'local-fonts',
    // TODO: extend dom interfaces?
  } as unknown as PermissionDescriptor);
}
