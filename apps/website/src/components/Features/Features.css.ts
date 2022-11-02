import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const main = style({
  overflow: 'hidden',
  backgroundColor: 'rgb(12 12 13 / 25)',
  paddingTop: themeVars.spacing[24],
  paddingBottom: themeVars.spacing[24],
});

export const container = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const cardBox = style({
  display: 'grid',
  gridTemplateRows: '1fr 1fr',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: themeVars.spacing['12'],
});

export const badgeComingSoon = style({
  backgroundColor: darkGrayScale.gray3,
  color: themeVars.dynamicColors.descriptionTextColor,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: themeVars.borderRadius.md,
  border: `1px solid ${darkGrayScale.gray6}`,
  paddingLeft: themeVars.spacing[2],
  paddingRight: themeVars.spacing[2],
});

export const altBadgeContainer = style({
  position: 'absolute',
  right: themeVars.spacing[2],
  top: themeVars.spacing[2],
});

export const card = style({
  border: `1px solid rgb(24 24 27)`,
  backgroundColor: 'rgb(39 39 42 / 0.25)',
  position: 'relative',
});

export const description = style({
  color: themeVars.dynamicColors.descriptionTextColor,
});

export const imageBox = style({
  position: 'relative',
  flex: 1,
});

export const textBox = style({
  flex: 1,
});

export const text = style({
  width: '70%',
});

export const image = style({
  transform: 'translate(0px, 100px)',
  position: 'absolute',
});
