import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {fallbackVar, style} from '@vanilla-extract/css';

export const headerIconRow = style({
  height: '56px',
  alignItems: 'center',
  display: 'flex',
  paddingLeft: themeVars.spacing['4'],
  columnGap: themeVars.spacing['2'],
});

export const headerIconRowCircle = style({
  selectors: {
    [`${headerIconRow} &`]: {
      width: '15px',
      height: '15px',
      margin: 'auto 0',
      borderRadius: themeVars.borderRadius.full,
      backgroundColor: fallbackVar(
        backgroundColorVar,
        themeVars.backgroundColor.gray['500'],
      ),
    },
  },
});
