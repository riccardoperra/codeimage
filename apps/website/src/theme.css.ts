import {themeColors, themeVars} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';
import {lchSupportStyle} from '~/core/supportLch';

export const [internalRootTheme, rootThemeVars] = createTheme({
  primaryTextColor: themeVars.backgroundColor.blue[500],
  green: themeVars.backgroundColor.green['500'],
  purple: themeVars.backgroundColor.purple['500'],
  red: themeVars.backgroundColor.red['500'],
  teal: themeVars.backgroundColor.teal['500'],
});

export const rootTheme = style([
  internalRootTheme,
  lchSupportStyle({
    vars: {
      [themeColors.primary]: 'lch(45% 85 260)',
      [themeColors.button.primary.backgroundColor]: 'lch(45% 85 260)',
      [rootThemeVars.primaryTextColor]: 'lch(45% 85 260)',
      [rootThemeVars.green]: 'lch(68.171% 90 152.173)',
      [rootThemeVars.purple]: 'lch(58.652% 85 302.105)',
      [rootThemeVars.red]: 'lch(60% 90 27.937)',
      [rootThemeVars.teal]: 'lch(65% 70 191.538)',
    },
  }),
]);
