import {createTheme, style} from '@vanilla-extract/css';
import {themeVars} from '@codeimage/ui';
import {scaffoldVars} from '../Sidebar/PropertyEditor/SidebarPopoverHost.css';
import {recipe, RecipeVariants} from '@vanilla-extract/recipes';

export const [sidebarTheme, sidebarVars] = createTheme({
  width: scaffoldVars.panelWidth,
  topOffset: scaffoldVars.toolbarHeight,
});

export const sidebar = recipe({
  base: style([
    sidebarTheme,
    {
      height: 'calc(100% - 32px)',
      borderRadius: themeVars.borderRadius.lg,
      top: '16px',
      overflow: 'hidden',
      flex: `0 0 ${sidebarVars.width}`,
      backgroundColor: themeVars.dynamicColors.panel.background,
      color: themeVars.dynamicColors.panel.textColor,
      zIndex: 0,
      transition: 'background-color .2s, border .2s',
    },
  ]),
  variants: {
    position: {
      right: {
        borderLeft: `1px solid ${themeVars.dynamicColors.divider}`,
        position: 'absolute',
        right: 16,
      },
      left: {
        position: 'absolute',
        left: 16,
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
