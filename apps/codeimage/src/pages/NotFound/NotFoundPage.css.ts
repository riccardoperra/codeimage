import {adaptiveFullScreenHeight, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const wrapper = style([
  adaptiveFullScreenHeight,
  {
    background: themeVars.dynamicColors.background,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    textAlign: 'center',
  },
]);

export const notFoundTitle = style({
  fontFamily: 'Jetbrains Mono',
  fontSize: '12rem',
  color: themeVars.dynamicColors.descriptionTextColor,
});

export const descriptionTitle = style({
  fontFamily: 'Jetbrains Mono',
  fontSize: themeVars.fontSize.lg,
  color: themeVars.dynamicColors.descriptionTextColor,
});
