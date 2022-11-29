import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/core/responsive';

export const container = style([
  {
    paddingTop: themeVars.spacing[24],
    paddingBottom: themeVars.spacing[24],
    background: darkGrayScale.gray1,
  },
]);

export const content = style([
  responsiveStyle({
    mobile: {
      paddingTop: themeVars.spacing[12],
    },
    desktop: {
      width: '1280px',
      paddingTop: themeVars.spacing[24],
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  }),
]);

export const grid = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexWrap: 'wrap',
  gap: '24px',
});

export const backdrop = style({
  content: '',
  zIndex: -1,
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  background: backgroundColorVar,
  transform: 'translate3d(0px, -50%, 0) scale(0.90)',
  filter: 'blur(500px) saturate(300%)',
  opacity: '0.7',
  transition: 'opacity 0.3s',
  borderRadius: '1.5rem',
  flex: 1,
  overflow: 'hidden',
  height: '500px',
  top: '50%',
});

export const codeContainerBg = createVar();
export const codeBlockBg = createVar();

export const codeContainer = style({
  borderRadius: themeVars.borderRadius.lg,
  background: codeContainerBg,
  padding: themeVars.spacing[8],
  position: 'relative',
});

export const codeBlock = style({
  borderRadius: themeVars.borderRadius.lg,
  background: codeBlockBg,
  padding: themeVars.spacing[6],
  fontSize: '13px',
});

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
    },
    desktop: {
      fontSize: themeVars.fontSize['3xl'],
    },
  }),
);
