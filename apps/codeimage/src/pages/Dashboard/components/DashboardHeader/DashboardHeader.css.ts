import {themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';
import {toolbarVars} from '../../../../components/Toolbar/Toolbar.css';
import * as toolbarStyles from '../../../../components/Toolbar/Toolbar.css';

export const header = style([
  toolbarStyles.toolbarTheme,
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
