import {themeVars} from '@codeimage/ui';
import '@codeimage/ui/themes/darkTheme';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {globalFontFace, globalStyle} from '@vanilla-extract/css';

globalFontFace('Mona Sans', {
  src: "url('/fonts/Mona-Sans.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans.woff2') format('woff2-variations')",
  fontWeight: '200 900',
  fontStretch: '75% 125%',
});

globalFontFace('Hubot Sans', {
  src: "url('/fonts/Hubot-Sans.woff2') format('woff2 supports variations'), url('/fonts/Hubot-Sans.woff2') format('woff2-variations')",
  fontWeight: '200 900',
  fontStretch: '75% 125%',
});

globalStyle('html, body', {
  fontFamily: 'Mona Sans, sans-serif',
  backgroundColor: darkGrayScale.gray1,
  color: themeVars.dynamicColors.baseText,
  margin: 0,
  padding: 0,
});

globalStyle('*', {
  boxSizing: 'border-box',
});

// globalStyle('html, body', {
//   fontFamily: 'Albert Sans, sans-serif',
//   backgroundColor: darkGrayScale.gray1,
//   color: themeVars.dynamicColors.baseText,
//   margin: 0,
//   padding: 0,
// });/////
//
// globalStyle('::-webkit-scrollbar', {
//   width: '18px',
// });
//
// globalStyle('::-webkit-scrollbar-track', {
//   backgroundColor: 'transparent',
// });
//
// globalStyle('::-webkit-scrollbar-thumb', {
//   backgroundColor: themeVars.dynamicColors.scrollBar.backgroundColor,
//   borderRadius: themeVars.borderRadius.full,
//   border: '6px solid transparent',
//   backgroundClip: 'content-box',
//   transition: 'background-color .2s',
// });
//
// globalStyle('::-webkit-scrollbar-thumb:hover', {
//   backgroundColor: themeVars.dynamicColors.scrollBar.hoverBackgroundColor,
// });
