import {coldarkColdTheme} from '@codeimage/highlight/coldarkCold';
import {coldarkDarkTheme} from '@codeimage/highlight/coldarkDark';
import {draculaTheme} from '@codeimage/highlight/dracula';
import {duotoneDarkTheme} from '@codeimage/highlight/duotoneDark';
import {duotoneSeaTheme} from '@codeimage/highlight/duotoneSea';
import {lightTheme} from '@codeimage/highlight/light';
import {materialLightTheme} from '@codeimage/highlight/materialLight';
import {materialOceanTheme} from '@codeimage/highlight/materialOcean';
import {materialPalenightTheme} from '@codeimage/highlight/materialPalenight';
import {materialVolcanoTheme} from '@codeimage/highlight/materialVolcano';
import {nightOwlTheme} from '@codeimage/highlight/nightOwl';
import {oneDarkTheme} from '@codeimage/highlight/oneDark';
import {synthwave84Theme} from '@codeimage/highlight/synthwave84';
import {vsCodeDarkTheme} from '@codeimage/highlight/vsCodeDark';

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
