import {createTheme, style} from '@vanilla-extract/css';

export const [stackTheme, stackThemeVars] = createTheme({
  spacing: '0px',
});

export const stack = style([
  stackTheme,
  {
    display: 'flex',
    // flexWrap: 'nowrap',
  },
]);

export const hStack = style([
  stack,
  {
    flexDirection: 'row',
    columnGap: stackThemeVars.spacing,
    alignItems: 'center',
  },
]);

export const vStack = style([
  stack,
  {flexDirection: 'column', rowGap: stackThemeVars.spacing},
]);
