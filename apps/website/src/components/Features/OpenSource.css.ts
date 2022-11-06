import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';

export const main = style({
  backgroundColor: darkGrayScale.gray1,
  overflow: 'hidden',
  // paddingTop: themeVars.spacing[24],
  // paddingBottom: themeVars.spacing[24],
});

export const editorImage = style({
  padding: themeVars.spacing[12],
});

export const editorImageCard = style({
  borderRadius: '1.5rem',
  flex: 1,
  background:
    'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
  overflow: 'hidden',
  height: '500px',
});

export const contributorsGrid = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(5, 1fr)',
  gap: themeVars.spacing[12],
});

export const contributorContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: themeVars.dynamicColors.dialog.panelShadow,
  borderRadius: themeVars.borderRadius.lg,
  padding: themeVars.spacing[8],
});

export const contributorName = style({
  marginTop: themeVars.spacing[4],
  marginBottom: themeVars.spacing[2],
});

export const userBadge = style({
  width: '72px',
  height: '72px',
  backgroundColor: themeVars.backgroundColor.blue['600'],
  color: themeVars.backgroundColor.white,
  overflow: 'hidden',
  position: 'relative',
  cursor: 'pointer',
});

export const badgePicture = style({
  width: '100%',
  position: 'absolute',
  height: '100%',
});

export const contributionsText = style({
  color: themeVars.textColor.green['500'],
  fontWeight: themeVars.fontWeight.medium,
});

export const githubLogo = style({
  width: '100%',
  height: '100vh',
  position: 'sticky',
  top: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#000',
  zIndex: 10,
});

export const contributorsContent = style({
  maxWidth: '80rem',
  margin: 'auto',
  marginTop: '-25%',
});

export const contributorsStickyContent = style({
  paddingTop: themeVars.spacing[24],
  paddingBottom: themeVars.spacing[24],
  width: '100%',
  position: 'sticky',
  top: 0,
});
