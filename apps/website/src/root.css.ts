import {themeColors, themeVars} from '@codeimage/ui';
import '@codeimage/ui/themes/darkTheme';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {
  createGlobalTheme,
  globalFontFace,
  globalStyle,
} from '@vanilla-extract/css';
import {assignInlineVars} from '@vanilla-extract/dynamic';

// globalFontFace('Mona Sans', {
//   src: "url('/fonts/Mona-Sans.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans.woff2') format('woff2-variations')",
//   fontWeight: '200 900',
//   fontStretch: '75% 125%',
//   fontDisplay: 'swap',
// });

globalFontFace('Mona Sans', {
  src: "url('/fonts/Mona-Sans-Regular.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-Regular.woff2') format('woff2-variations')",
  fontWeight: '400',
  fontStyle: 'normal',
  fontStretch: '75% 125%',
  fontDisplay: 'swap',
});

globalFontFace('Mona Sans', {
  src: "url('/fonts/Mona-Sans-Medium.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-Medium.woff2') format('woff2-variations')",
  fontWeight: '500',
  fontStyle: 'normal',
  fontStretch: '75% 125%',
  fontDisplay: 'swap',
});

globalFontFace('Mona Sans', {
  src: "url('/fonts/Mona-Sans-SemiBold.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-SemiBold.woff2') format('woff2-variations')",
  fontWeight: '600',
  fontStyle: 'normal',
  fontStretch: '75% 125%',
  fontDisplay: 'swap',
});

globalFontFace('Mona Sans', {
  src: "url('/fonts/Mona-Sans-Bold.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-Bold.woff2') format('woff2-variations')",
  fontWeight: '700',
  fontStyle: 'normal',
  fontStretch: '75% 125%',
  fontDisplay: 'swap',
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

globalStyle(
  `[data-codeimage-theme=dark]`,
  assignInlineVars({
    [themeColors.primary]: '#0072D6',
    [themeColors.button.primary.backgroundColor]: '#0072D6',
  }),
);
