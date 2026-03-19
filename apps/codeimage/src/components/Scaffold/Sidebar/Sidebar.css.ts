import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';
import {scaffoldVars} from '../Scaffold.css';
import {recipe, type RecipeVariants} from '@vanilla-extract/recipes';

export const [sidebarTheme, sidebarVars] = createTheme({
  width: scaffoldVars.panelWidth,
  topOffset: scaffoldVars.toolbarHeight,
});

export const sidebar = recipe({
  base: style([
    sidebarTheme,
    {
      height: '100%',
      width: sidebarVars.width,
      backgroundColor: themeVars.dynamicColors.panel.background,
      color: themeVars.dynamicColors.panel.textColor,
      zIndex: 1,
      transition: 'background-color .2s, border .2s',
      overflowY: 'auto',
      overflowX: 'hidden',
      paddingRight: themeVars.spacing['2'],
      '@supports': {
        '(scrollbar-gutter: stable)': {
          paddingRight: 0,
          scrollbarGutter: 'stable',
        },
      },
      flexShrink: 0,
    },
  ]),
  variants: {
    position: {
      none: {},
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
