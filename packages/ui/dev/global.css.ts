import {globalStyle} from '@vanilla-extract/css';
import {themeVars} from '../src/lib/theme/global2.css';

globalStyle('html, body', {
  fontFamily: 'Albert Sans, sans-serif',
  backgroundColor: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.baseText,
});
