import {themeVars} from '@codeimage/ui';
import {createVar, keyframes, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/core/responsive';

export const progressOpacityEditor = createVar();

const dotColor = createVar();

export const main = style({
  vars: {
    [dotColor]: '#dddddd10',
  },
  margin: 'auto',
  flexDirection: 'column',
  overflow: 'hidden',
  height: '100%',
  width: '100%',
  minHeight: '100%',
  position: 'relative',

  '::before': {
    content: '""',
    background: 'linear-gradient(179deg, #09090900 0%, #000000 70%)',
    position: 'absolute',
    bottom: '0',
    height: '100%',
    width: '100%',
    zIndex: '0',
  },
});

export const content = style([
  {
    marginTop: '32px',
    zIndex: 1,

    paddingTop: themeVars.spacing[24],
    paddingBottom: themeVars.spacing[24],
    paddingLeft: themeVars.spacing[4],
    paddingRight: themeVars.spacing[4],

    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(1,minmax(0,1fr))',
  },
  responsiveStyle({
    mobile: {
      paddingTop: themeVars.spacing[12],
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

export const bgAnimation = keyframes({
  '0%': {
    opacity: '0',
  },
  '50%': {
    opacity: '1',
  },
  '100%': {
    opacity: '0',
  },
});

export const imageSection = style(
  responsiveStyle({
    mobile: {
      marginTop: themeVars.spacing[8],

      backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
      backgroundSize: 'calc(10 * 1px) calc(10 * 1px)',
      color: '#0077FF75',
    },
    desktop: {
      width: '55%',
      maxWidth: '1280px',
      borderRadius: '24px',
    },
  }),
);

const float = keyframes({
  '0%': {
    transform: 'translateY(-20px)',
  },
  '50%': {
    transform: 'translateY(0px)',
  },
  '100%': {
    transform: 'translateY(-20px)',
  },
});

export const imageBox = style([
  {
    position: 'relative',
    display: 'flex',
    flex: '0 0 auto',
    width: '100%',
    marginTop: 0,
    borderRadius: '12px',
    overflow: 'hidden',
    background:
      'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
  },
  responsiveStyle({
    desktop: {
      borderRadius: '42px',
      transform: 'translate(40px, -40px)',
    },
  }),
]);

// export const imagePattern = style({
//   backgroundColor: 'transparent',
//   backgroundImage: 'radial-gradient(transparent 1px,var(--background) 1px)',
//   backgroundSize: '5px 5px',
//   inset: '15px -15px -15px 15px',
// });

export const imagePerspectiveBox = style([
  {
    position: 'relative',
    display: 'flex',
    gridColumnStart: 1,
    justifyContent: 'flex-end',
    animation: `${float} 6s ease-in-out infinite`,
  },
  responsiveStyle({
    mobile: {
      gridRowStart: 2,
      paddingBottom: themeVars.spacing[12],
    },
    desktop: {
      gridRowStart: 1,
      paddingBottom: 0,
      marginTop: '240px',
    },
  }),
]);

export const textBox = style([
  {
    gridRowStart: 1,
    gridColumnStart: 1,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    zIndex: 1,
  },
  responsiveStyle({
    mobile: {
      marginTop: 0,
      paddingTop: 0,
    },
  }),
]);

export const heroContainer = style({
  width: '90%',
});

export const heading = style([
  {
    maxWidth: '860px',
    textAlign: 'left',
    fontSize: '44px',
    lineHeight: '100%',
    margin: 0,
  },
  responsiveStyle({
    mobile: {
      fontSize: '52px',
    },
    tablet: {
      fontSize: '64px',
      width: '100%',
    },
    desktop: {
      fontSize: '4.5rem',
      maxWidth: '44rem',
    },
  }),
]);

export const mobileDescription = style(
  responsiveStyle({
    mobile: {
      fontSize: '24px',
      color: themeVars.dynamicColors.baseText,
      marginTop: themeVars.spacing[4],
      marginBottom: themeVars.spacing[4],
      fontWeight: '500',
      lineHeight: 1.25,
    },
    tablet: {
      maxWidth: '32rem',
    },
  }),
);

export const backdropTransform = keyframes({
  '0%': {
    transform: 'translateY(80%)',
    opacity: 1,
  },
  '70%': {
    filter: 'blur(400px)',
  },
  '85%': {
    transform: 'translateY(0)',
  },
  '100%': {
    transform: 'translateY(0)',
    filter: 'blur(160px)',
    opacity: 0.5,
  },
});

export const imageLeft = style([
  {
    zIndex: 1,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  responsiveStyle({
    mobile: {
      minHeight: '240px',
    },
    tablet: {
      minHeight: '450px',
    },
  }),
]);

export const backdrop = style({
  filter: 'blur(160px)',
  transform: 'translateZ(0px)',
  opacity: '.5',
  background:
    'conic-gradient(from 230.29deg at 51.63% 52.16%, rgb(36, 0, 255) 0deg, rgb(0, 135, 255) 67.5deg, rgb(108, 39, 157) 198.75deg, rgb(24, 38, 163) 251.25deg, rgb(54, 103, 196) 301.88deg, rgb(105, 30, 255) 360deg)',
  overflow: 'hidden',
  backgroundSize: '400% 400%',
  width: '60%',
  height: '100%',
  position: 'absolute',
  zIndex: 0,
  margin: 'auto',
  animation: `${bgAnimation} 7s ease infinite, ${backdropTransform} 6s ease-in-out 1`,
  marginTop: '100px',
});

export const screenshot = style({
  color: themeVars.backgroundColor.blue[500],
});

export const ctaContainer = style(
  responsiveStyle({
    mobile: {
      display: 'flex',
      marginTop: themeVars.spacing[4],
      flexDirection: 'column',
      flexWrap: 'wrap',
      gap: themeVars.spacing[4],
      alignItems: 'flex-start',
    },
    tablet: {
      flexDirection: 'row',
    },
    desktop: {
      marginTop: themeVars.spacing[12],
    },
  }),
);
