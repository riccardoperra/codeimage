import {backgroundColorVar, themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

const textAlignFlex = createVar();

export const container = style([
  {
    background: darkGrayScale.gray1,
  },
  responsiveStyle({
    mobile: {
      paddingTop: themeVars.spacing[12],
      paddingBottom: themeVars.spacing[12],
    },
    tablet: {
      paddingTop: themeVars.spacing[24],
      paddingBottom: themeVars.spacing[24],
    },
  }),
]);

export const content = style([
  responsiveStyle({
    mobile: {
      paddingTop: themeVars.spacing[0],
      paddingLeft: themeVars.spacing[6],
      paddingRight: themeVars.spacing[6],
    },
    desktop: {
      maxWidth: '1280px',
      width: '100%',
      paddingTop: themeVars.spacing[24],
      marginLeft: 'auto',
      marginRight: 'auto',
    },
  }),
]);

export const grid = style([
  responsiveStyle({
    mobile: {
      vars: {
        [textAlignFlex]: 'flex-start',
      },
    },
    tablet: {
      vars: {
        [textAlignFlex]: 'center',
      },
    },
    desktop: {
      justifyContent: 'center',
    },
  }),
  {
    display: 'flex',
    alignItems: textAlignFlex,
    flexWrap: 'wrap',
    gap: '24px',
    marginTop: themeVars.spacing[8],
  },
]);

export const backdrop = style([
  {
    content: '',
    zIndex: -1,
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    background: backgroundColorVar,
    transform: 'translate3d(0px, -50%, 0) scale(.75)',
    filter: 'blur(200px) saturate(500%)',
    opacity: 0,
    transition: 'opacity 0.3s',
    borderRadius: '1.5rem',
    flex: 1,
    overflow: 'hidden',
    height: '100%',
    top: '50%',
    selectors: {
      '[data-in-view=true] &': {
        opacity: 0.5,
      },
    },
  },
]);

export const codeContainerBg = createVar();
export const codeBlockBg = createVar();

export const codeContainer = style({
  borderRadius: themeVars.borderRadius.lg,
  background: codeContainerBg,
  padding: themeVars.spacing[8],
  position: 'relative',
  zIndex: 5,
  isolation: 'isolate',
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
      textAlign: 'left',
      marginBottom: 0,
      paddingTop: themeVars.spacing[4],
      paddingBottom: themeVars.spacing[4],
    },
    desktop: {
      textAlign: 'center',
      fontSize: themeVars.fontSize['6xl'],
    },
  }),
);

export const description = style(
  responsiveStyle({
    mobile: {
      fontSize: themeVars.fontSize['2xl'],
      textAlign: 'left',
      margin: 0,
      marginBottom: themeVars.spacing[8],
    },
    desktop: {
      fontSize: themeVars.fontSize['3xl'],
      textAlign: 'center',
    },
  }),
);

export const ctaContainer = style(
  responsiveStyle({
    mobile: {
      display: 'flex',
      marginTop: themeVars.spacing[16],
    },
    desktop: {
      justifyContent: 'center',
      marginTop: themeVars.spacing[24],
    },
  }),
);
