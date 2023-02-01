import {themeColors, themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {globalStyle} from '@vanilla-extract/css';
import {assignInlineVars} from '@vanilla-extract/dynamic';

globalStyle('html, body', {
  fontFamily:
    'Mona Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
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
