import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';

export const [toolbarTheme, toolbarVars] = createTheme({
  backgroundColor: themeVars.backgroundColor.white,
  toolbarHeight: '60px',
});

export const wrapper = style([
  toolbarTheme,
  {
    padding: '0px 18px',
    display: 'flex',
    alignItems: 'center',
    color: themeVars.textColor.blue['900'],
    fontSize: '18px',
    fontWeight: 'bold',
    zIndex: 30,
    height: toolbarVars.toolbarHeight,
    width: '100%',
    backgroundColor: themeVars.dynamicColors.panel.background,
    borderBottom: `1px solid ${themeVars.dynamicColors.divider}`,

    '@media': {
      'screen and (max-width: 768px)': {
        height: `calc(${toolbarVars.toolbarHeight} + env(safe-area-inset-top, 0))`,
        paddingTop: `env(safe-area-inset-top, 0)`,
      },
    },
  },
]);

export const title = style({});

export const actionBox = style({
  display: 'flex',
  flexWrap: 'nowrap',
  flexDirection: 'row',
  flex: '1',
  alignItems: 'center',
  columnGap: themeVars.spacing['3'],
});
