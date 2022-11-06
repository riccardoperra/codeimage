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

globalStyle('::-webkit-scrollbar', {
  width: '18px',
});

globalStyle('::-webkit-scrollbar-track', {
  backgroundColor: 'transparent',
});

globalStyle('::-webkit-scrollbar-thumb', {
  backgroundColor: themeVars.dynamicColors.scrollBar.backgroundColor,
  borderRadius: themeVars.borderRadius.full,
  border: '6px solid transparent',
  backgroundClip: 'content-box',
  transition: 'background-color .2s',
});

globalStyle('::-webkit-scrollbar-thumb:hover', {
  backgroundColor: themeVars.dynamicColors.scrollBar.hoverBackgroundColor,
});
