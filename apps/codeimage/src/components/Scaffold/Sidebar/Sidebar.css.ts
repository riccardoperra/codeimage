import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';
import {scaffoldVars} from '../Scaffold.css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const [sidebarTheme, sidebarVars] = createTheme({
  width: scaffoldVars.panelWidth,
  topOffset: scaffoldVars.toolbarHeight,
});

export const sidebar = recipe({
  base: style([
    sidebarTheme,
    {
      height: '100%',
      flex: `0 0 ${sidebarVars.width}`,
      backgroundColor: themeVars.dynamicColors.panel.background,
      color: themeVars.dynamicColors.panel.textColor,
      zIndex: 0,
      transition: 'background-color .2s, border .2s',
      overflow: 'auto',
    },
  ]),
  variants: {
    position: {
      right: {
        borderLeft: `1px solid ${themeVars.dynamicColors.divider}`,
      },
      left: {
        borderRight: `1px solid ${themeVars.dynamicColors.divider}`,
      },
    },
  },
});

export const sidebarLogo = style({
  display: 'flex',
  alignItems: 'center',
});

export type SidebarVariants = RecipeVariants<typeof sidebar>;
