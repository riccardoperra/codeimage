import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme';
import * as flexFieldStyles from '../Field/FlexField.css';

export const [rangeTheme, rangeVars] = createTheme({
  rangeProgress: '0%',
});

export const range = style([
  rangeTheme,
  {
    width: '100%',
    appearance: 'none',
    position: 'relative',
    backgroundColor: themeVars.backgroundColor.transparent,
    height: flexFieldStyles.inputHeight,

    '::-moz-range-thumb': {
      appearance: 'none',
      boxShadow: themeVars.boxShadow.lg,
      backgroundColor: themeVars.backgroundColor.white,
      border: `1px solid ${themeVars.dynamicColors.divider}`,
      borderRadius: themeVars.borderRadius.full,
      height: '12px',
      width: '12px',
      marginTop: 'calc(12px / -2)',
    },

    '::-webkit-slider-thumb': {
      appearance: 'none',
      boxShadow: themeVars.boxShadow.lg,
      backgroundColor: themeVars.backgroundColor.white,
      border: `1px solid ${themeVars.dynamicColors.divider}`,
      borderRadius: themeVars.borderRadius.full,
      height: '12px',
      width: '12px',
      marginTop: 'calc(12px / -2)',
    },

    '::-moz-range-track': {
      width: '100%',
      cursor: 'pointer',
      borderRadius: 0,
      border: `1px solid ${themeVars.backgroundColor.gray}`,
      background: `linear-gradient(90deg, ${themeVars.backgroundColor.blue['500']} ${rangeVars.rangeProgress}, ${themeVars.dynamicColors.divider}  ${rangeVars.rangeProgress})`,
      height: '2px',
    },

    '::-webkit-slider-runnable-track': {
      width: '100%',
      cursor: 'pointer',
      borderRadius: 0,
      border: `1px solid ${themeVars.backgroundColor.gray}`,
      background: `linear-gradient(90deg, ${themeVars.backgroundColor.blue['500']} ${rangeVars.rangeProgress}, ${themeVars.dynamicColors.divider}  ${rangeVars.rangeProgress})`,
      height: '2px',
    },

    selectors: {
      [`&:disabled::-webkit-slider-runnable-track`]: {
        opacity: 0.3,
        cursor: 'not-allowed',
      },
      [`&:disabled::-moz-range-track`]: {
        opacity: 0.3,
        cursor: 'not-allowed',
      },
      [`&:disabled::-webkit-slider-thumb`]: {
        cursor: 'not-allowed',
      },
      [`&:disabled::-moz-range-thumb`]: {
        cursor: 'not-allowed',
      },
    },
  },
]);
