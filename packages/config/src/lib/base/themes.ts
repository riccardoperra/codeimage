import {coldarkColdTheme} from '@codeimage/theme/coldarkCold';
import {coldarkDarkTheme} from '@codeimage/theme/coldarkDark';
import {draculaTheme} from '@codeimage/theme/dracula';
import {duotoneDarkTheme} from '@codeimage/theme/duotoneDark';
import {duotoneSeaTheme} from '@codeimage/theme/duotoneSea';
import {lightTheme} from '@codeimage/theme/light';
import {materialLightTheme} from '@codeimage/theme/materialLight';
import {materialOceanTheme} from '@codeimage/theme/materialOcean';
import {materialPalenightTheme} from '@codeimage/theme/materialPalenight';
import {materialVolcanoTheme} from '@codeimage/theme/materialVolcano';
import {nightOwlTheme} from '@codeimage/theme/nightOwl';
import {oneDarkTheme} from '@codeimage/theme/oneDark';
import {synthwave84Theme} from '@codeimage/theme/synthwave84';
import {vsCodeDarkTheme} from '@codeimage/theme/vsCodeDark';

export const SUPPORTED_THEMES = [
  vsCodeDarkTheme,
  nightOwlTheme,
  draculaTheme,
  materialOceanTheme,
  synthwave84Theme,
  materialVolcanoTheme,
  oneDarkTheme,
  lightTheme,
  materialPalenightTheme,
  // TODO: to refactor -> ugly themes
  // arcDarkTheme,
  // holiTheme,
  duotoneSeaTheme,
  duotoneDarkTheme,
  coldarkColdTheme,
  coldarkDarkTheme,
  materialLightTheme,
] as const;
