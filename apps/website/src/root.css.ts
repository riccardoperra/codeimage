import '@codeimage/ui/themes/darkTheme';
import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {globalStyle} from '@vanilla-extract/css';

globalStyle('html, body', {
  fontFamily: 'Albert Sans, sans-serif',
  backgroundColor: darkGrayScale.gray1,
  color: themeVars.dynamicColors.baseText,
  margin: 0,
  padding: 0,
});
