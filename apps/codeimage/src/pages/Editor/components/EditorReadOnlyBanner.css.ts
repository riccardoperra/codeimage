import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {darkGrayScale} from '../../../theme/dark-theme.css';

export const banner = style({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: `${themeVars.spacing['2']} ${themeVars.spacing['5']}`,
  selectors: {
    '[data-codeimage-theme=dark] &': {
      background: darkGrayScale.gray5,
      color: darkGrayScale.gray12,
    },
    '[data-codeimage-theme=light] &': {
      background: themeVars.backgroundColor.gray['200'],
      color: themeVars.backgroundColor.gray['900'],
    },
  },
});
