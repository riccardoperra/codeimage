import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {globalStyle} from '@vanilla-extract/css';

globalStyle('html, body', {
  fontFamily: 'Albert Sans, sans-serif',
  backgroundColor: backgroundColorVar,
  backdropFilter: 'brightness(0.8)',
  overflow: 'hidden',
  width: '100%',
  height: '100%',
  color: themeVars.dynamicColors.baseText,
});
