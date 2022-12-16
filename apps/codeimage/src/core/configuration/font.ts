import {mapToDictionary} from '../helpers/mapToDictionary';

interface CustomFontType {
  name: string;
  weight: number;
}

interface CustomFontConfiguration {
  readonly id: string;
  readonly name: string;
  readonly types: readonly CustomFontType[];
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
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'source-code-pro',
    name: 'Source Code pro',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'overpass-mono',
    name: 'Overpass Mono',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Bold', weight: 700},
    ],
  },
] as const);
