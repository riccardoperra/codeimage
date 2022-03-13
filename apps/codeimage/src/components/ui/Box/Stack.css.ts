import {createTheme, style} from '@vanilla-extract/css';
import {sprinkles} from '../../../theme/sprinkles.css';

export const [stackTheme, stackThemeVars] = createTheme({
  spacing: '0px',
});

export const stack = style([
  stackTheme,
  sprinkles({display: 'flex', flexWrap: 'nowrap'}),
]);

export const hStack = style([
  stack,
  {
    flexDirection: 'row',
    columnGap: stackThemeVars.spacing,
  },
]);

export const vStack = style([
  stack,
  {flexDirection: 'column', rowGap: stackThemeVars.spacing},
]);
