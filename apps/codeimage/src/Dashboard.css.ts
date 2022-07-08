import {textStyles, themeVars} from '@codeimage/ui';
import {style} from '@vanilla-extract/css';

export const title = style([
  textStyles.fontSize['4xl'],
  textStyles.fontWeight.semibold,
  {
    marginBottom: themeVars.spacing['8'],
  },
]);

export const wrapper = style({
  width: '1280px',
  margin: 'auto',
  color: themeVars.dynamicColors.panel.textColor,
  marginTop: themeVars.spacing['12'],
});

export const gridList = style({
  display: 'grid',
  gap: '1rem',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  width: '100%',
});

export const item = style({
  backgroundColor: themeVars.dynamicColors.background,
  width: '100%',
  height: '128px',
  borderRadius: themeVars.borderRadius.md,
  padding: themeVars.spacing['3'],
  boxShadow: themeVars.boxShadow.md,
});
