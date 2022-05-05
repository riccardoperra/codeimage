import {createTheme, style} from '@vanilla-extract/css';
import * as textFieldStyles from '../TextField/TextField.css';
import {themeVars} from '../../theme';

export const [segmentedFieldTheme, segmentedFieldVars] = createTheme({
  activeSegmentedWidth: '0px',
  activeSegmentedOffset: '0%',
  activeSegmentedBackgroundColor: themeVars.dynamicColors.input.accentColor,
  segmentedTextColor: themeVars.dynamicColors.input.textColor,
  activeSegmentedTextColor: themeVars.dynamicColors.input.textColor,
});

export const wrapper = style([
  segmentedFieldTheme,
  textFieldStyles.baseField, // Add basic text field theme to not override
  {
    alignItems: 'stretch',
    width: '100%',
  },
  {
    display: 'flex',
    overflow: 'visible',
    borderRadius: themeVars.borderRadius.md,
    cursor: 'default',
    textAlign: 'center',
    userSelect: 'none',
    backgroundColor: textFieldStyles.textFieldVars.background,
  },
]);

export const box = style([
  {
    flexDirection: 'row',
    position: 'relative',
    flex: 1,
    display: 'flex',
    alignContent: 'stretch',
    alignItems: 'stretch',
  },
]);

export const segment = style([
  {
    width: '1px',
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    padding: `0 ${themeVars.spacing['1']}`,
    color: segmentedFieldVars.segmentedTextColor,
    opacity: 0.65,
    fontWeight: themeVars.fontWeight.medium,
    selectors: {
      '&:not(:disabled)': {
        cursor: 'pointer',
      },
      '&[data-active=true]': {
        fontWeight: themeVars.fontWeight.semibold,
        opacity: 1,
        color: segmentedFieldVars.activeSegmentedTextColor,
      },
    },
  },
]);

export const segmentActive = style([
  {
    position: 'absolute',
    height: '100%',
    left: segmentedFieldVars.activeSegmentedOffset,
    width: segmentedFieldVars.activeSegmentedWidth,
    transition: 'left .2s cubic-bezier(.2, 0, 0, 1)',
    '::after': {
      position: 'absolute',
      inset: '2px',
      backgroundColor: segmentedFieldVars.activeSegmentedBackgroundColor,
      content: '',
      top: 1,
      boxShadow: themeVars.boxShadow.default,
      borderRadius: themeVars.borderRadius.default,
    },
  },
]);
