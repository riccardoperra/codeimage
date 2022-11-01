import {themeVars} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
  toolbarHeight: '56px',
});

export const header = style([
  toolbarTheme,
  {
    padding: `0px ${themeVars.spacing['3']}`,
    display: 'flex',
    height: toolbarVars.toolbarHeight,
    background: themeVars.dynamicColors.background,
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
