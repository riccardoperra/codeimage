import {themeVars} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
  toolbarHeight: '56px',
});

export const header = style([
  toolbarTheme,
  {
    padding: `${themeVars.spacing[0]} ${themeVars.spacing['3']}`,
    display: 'flex',
    position: 'fixed',
    width: '100%',
    height: toolbarVars.toolbarHeight,
    zIndex: themeVars.zIndex['50'],
    backdropFilter: 'saturate(180%) blur(20px)',
    borderBottom: `1px solid ${themeVars.dynamicColors.divider}`,
  },
]);

export const headerContent = style({
  width: '100%',
  margin: 'auto',
  display: 'flex',
  alignItems: 'center',
  '@media': {
    [`(min-width: 1280px)`]: {
      width: '1280px',
    },
  },
});
