import {themeVars} from '@codeimage/ui';
import {createVar, keyframes, style} from '@vanilla-extract/css';
import {gradientBlueBg} from '~/theme/gradients.css';
import {responsiveStyle} from '~/theme/responsive';
import {rootThemeVars} from '~/theme/theme.css';

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
    transform: 'translate(40px, -40px)',
  },
  '50%': {
    transform: 'translate(40px, -25px)',
  },
  '100%': {
    transform: 'translate(40px, -40px)',
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
  },
  responsiveStyle({
    desktop: {
      borderRadius: '42px',
      animation: `${float} 6s ease-in-out infinite`,
    },
  }),
  gradientBlueBg,
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
  },
  responsiveStyle({
    mobile: {
      gridRowStart: 2,
      paddingBottom: themeVars.spacing[12],
    },
    desktop: {
      gridRowStart: 1,
      paddingBottom: 0,
      marginTop: '200px',
      marginBottom: '20px',
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

export const screenshot = style({
  color: rootThemeVars.primaryTextColor,
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
