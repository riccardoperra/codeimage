import {mapToDictionary} from '../helpers/mapToDictionary';

interface CustomFontType {
  name: string;
  weight: number;
  fontData?: FontData;
}

export interface CustomFontConfiguration {
  id: string;
  name: string;
  custom: boolean;
  types: readonly CustomFontType[];
}

function createCustomFonts<T extends ReadonlyArray<CustomFontConfiguration>>(
  fonts: T,
) {
  const configuration = fonts;
  const dictionary = mapToDictionary(fonts, 'id');
  return [configuration, dictionary] as const;
}

export const [SUPPORTED_FONTS, SUPPORTED_FONTS_DICTIONARY] = createCustomFonts([
  {
    id: 'jetbrains-mono',
    name: 'Jetbrains Mono',
    custom: false,
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    custom: false,
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'source-code-pro',
    name: 'Source Code pro',
    custom: false,
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'overpass-mono',
    name: 'Overpass Mono',
    custom: false,
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    custom: false,
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    custom: false,
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Bold', weight: 700},
    ],
  },
] as const);
