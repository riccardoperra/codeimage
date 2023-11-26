import {LoadedFont} from '../../hooks/use-local-fonts';
import {mapToDictionary} from '../helpers/mapToDictionary';

interface CustomFontType {
  name: string;
  weight: number;
  fontData?: FontData;
}

interface WebFontConfiguration {
  id: string;
  name: string;
  type: 'web';
  types: readonly CustomFontType[];
}

interface SystemFontConfiguration {
  id: string;
  name: string;
  type: 'system';
  fontData: LoadedFont;
  types: readonly CustomFontType[];
}

export type CustomFontConfiguration =
  | WebFontConfiguration
  | SystemFontConfiguration;

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
    type: 'web',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'fira-code',
    name: 'Fira Code',
    type: 'web',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'source-code-pro',
    name: 'Source Code pro',
    type: 'web',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'overpass-mono',
    name: 'Overpass Mono',
    type: 'web',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Medium', weight: 500},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'space-mono',
    name: 'Space Mono',
    type: 'web',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Bold', weight: 700},
    ],
  },
  {
    id: 'cascadia-code',
    name: 'Cascadia Code',
    type: 'web',
    types: [
      {name: 'Regular', weight: 400},
      {name: 'Bold', weight: 700},
    ],
  },
] as const);
