import {themeVars} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';

export const islandWidth = createVar();

export const screen = style({
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  background: themeVars.dynamicColors.panel.background,
  color: themeVars.dynamicColors.baseText,
});

export const body = style({
  display: 'flex',
  flex: 1,
  minHeight: 0,
  gap: themeVars.spacing['2'],
  padding: `0 ${themeVars.spacing['2']} ${themeVars.spacing['2']}`,
});

const island = style({
  borderRadius: '22px',
  background: themeVars.dynamicColors.background,
});

export const canvasIsland = style([
  island,
  {
    display: 'flex',
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
  },
]);

export const themeIsland = style([
  island,
  {
    display: 'flex',
    flexDirection: 'column',
    flex: 'none',
    gap: themeVars.spacing['3'],
    width: islandWidth,
    minHeight: 0,
    padding: `${themeVars.spacing['4']} ${themeVars.spacing['4']} 0`,
  },
]);

export const islandTitle = style({
  fontSize: themeVars.fontSize.base,
  fontWeight: themeVars.fontWeight.semibold,
});

export const picker = style({flex: 1, minHeight: 0});
