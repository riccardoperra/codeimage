import '@codeimage/ui/themes/darkTheme';
import {themeVars} from '@codeimage/ui';
import {globalStyle} from '@vanilla-extract/css';

globalStyle('html, body', {
  fontFamily: 'Albert Sans, sans-serif',
  backgroundColor: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.baseText,
  margin: 0,
  padding: 0,
});
