import {globalStyle} from '@vanilla-extract/css';
import {themeVars} from '../src';

globalStyle('html, body', {
  fontFamily: 'Albert Sans, sans-serif',
  backgroundColor: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.baseText,
});
