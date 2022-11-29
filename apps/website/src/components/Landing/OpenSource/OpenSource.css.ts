import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/core/responsive';

export const main = style({
  backgroundColor: darkGrayScale.gray2,
  overflow: 'hidden',
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
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 10,
});

export const contributorsContent = style({
  maxWidth: '80rem',
  margin: 'auto',
});

export const contributorsStickyContent = style({
  paddingTop: themeVars.spacing[24],
  paddingBottom: themeVars.spacing[24],
  width: '100%',
});

export const codeImageExampleImage = style([
  editorImage,
  {
    width: '100%',
    padding: 0,
  },
]);

export const heading = style(
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['4xl'],
      textAlign: 'center',
      marginBottom: 0,
      padding: themeVars.spacing[4],
    },
    desktop: {
      fontSize: themeVars.fontSize['6xl'],
    },
  }),
);

export const description = style(
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['2xl'],
      textAlign: 'center',
      margin: 0,
      marginBottom: themeVars.spacing[8],
      padding: themeVars.spacing[4],
    },
    desktop: {
      fontSize: themeVars.fontSize['3xl'],
    },
  }),
);
