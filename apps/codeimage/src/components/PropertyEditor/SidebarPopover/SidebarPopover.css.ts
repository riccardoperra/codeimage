import {themeVars} from '@codeimage/ui';
import {responsiveStyle, themeTokens} from '@codeui/kit';
import {style} from '@vanilla-extract/css';

export const sidebarPopover = style([
  {
    width: '360px',
    maxWidth: '360px',
    display: 'flex',
    flexDirection: 'column',
    gap: themeTokens.spacing['3'],
  },
  responsiveStyle({
    md: {
      maxWidth: 'initial',
    },
  }),
]);

export const experimentalFlag = style({
  color: themeVars.dynamicColors.descriptionTextColor,
  fontSize: themeVars.fontSize.xs,
});
