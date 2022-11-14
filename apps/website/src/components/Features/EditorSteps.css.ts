import {themeVars} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import {createVar, style} from '@vanilla-extract/css';

export const sectionCount = createVar();
const sectionHeight = createVar();

export const sectionWrapper = style({
  backgroundColor: '#000',
  height: '100%',
  '@media': {
    '(min-width: 748px)': {
      height: '300vh',
    },
  },
  position: 'relative',
  vars: {
    [sectionHeight]: '100vh',
    [sectionCount]: '3',
  },
});

export const content = style({
  maxWidth: '80rem',
  position: 'relative',
  marginLeft: 'auto',
  marginRight: 'auto',
  '@media': {
    '(min-width: 1024px)': {
      padding: '100px 100px 100px',
      paddingBottom: 0,
      height: 'auto',
    },
  },
});

export const editorSectionInfo = style({
  marginLeft: 'auto',
  marginRight: 'auto',
  position: 'relative',
  overflow: 'hidden',
  order: -1,
});

export const sectionContainer = style({
  height: `100%`,
  display: 'flex',
  width: '100%',
});

export const textParallaxBox = style({
  display: 'flex',
  alignItems: 'center',
  border: `1px solid rgb(24 24 27)`,
  backgroundColor: 'rgb(39 39 42 / 0.25)',
  placeContent: 'center flex-start',
  flexFlow: 'row nowrap',
  gap: '96px',
  overflow: 'visible',
  flex: 1,
  position: 'relative',
  flexDirection: 'column',
  padding: '24px',
  borderRadius: '24px',
});

export const editorParallaxContent = style({
  display: 'grid',
  gridTemplateRows: '1fr 1fr 1fr',
  flexDirection: 'row',
  gap: '24px',
  '@media': {
    '(min-width: 748px)': {
      gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))',
      gridTemplateRows: '1fr',
    },
  },
});

export const scrollContainer = style({
  display: 'flex',
  flexDirection: 'column',
  top: 0,
});

export const editorImage = style({
  padding: themeVars.spacing[12],
  position: 'absolute',
});

export const editorImageSticky = style({
  position: 'sticky',
  width: `100%`,
  display: 'flex',
  alignItems: 'center',
  willChange: 'transform',
  flexDirection: 'column',
  zIndex: '1',
  left: '0px',
  gap: '24px',
  filter: 'saturate(1.2)',
  height: '100vh',
  top: '100px',
  maxWidth: '80rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  '@media': {
    '(min-width: 1024px)': {
      height: '100vh',
    },
  },
});

export const editorImageCardShadowBg = createVar();

export const editorImageCard = style({
  borderRadius: '1.5rem',
  flex: 1,
  background:
    'linear-gradient(140deg, rgb(9, 171, 241), rgb(5, 105, 148), rgb(4, 84, 118), rgb(6, 119, 167))',
  overflow: 'hidden',
  height: '100%',
  position: 'relative',
});

export const editorImageCardContainer = style({
  maxHeight: '60vh',
  height: '100%',
  width: '100%',
  position: 'relative',
  flex: 1,
  display: 'flex',
  borderRadius: themeVars.borderRadius.xl,
});

export const editorImageCardBackdrop = style({
  content: '',
  zIndex: -1,
  position: 'absolute',
  right: 0,
  bottom: 0,
  left: 0,
  background: editorImageCardShadowBg,
  transform: 'translate3d(0px, -50%, 0) scale(0.85)',
  filter: 'blur(500px) saturate(180%)',
  opacity: '0.7',
  transition: 'opacity 0.3s',
  borderRadius: '1.5rem',
  flex: 1,
  overflow: 'hidden',
  height: '500px',
  top: '50%',
});

///////////////////

export const editorBox = style({
  width: '600px',
  height: 'auto',
  padding: themeVars.spacing[6],
  backgroundColor: 'rgba(0,0,0,.7)',
  borderRadius: themeVars.borderRadius.lg,
  fontSize: '15px',
});

export const twitterCard = style({
  padding: themeVars.spacing[12],
  paddingTop: themeVars.spacing[6],
  borderRadius: '8px',
  backgroundColor: darkGrayScale.gray2,
  height: 'auto',
  position: 'absolute',
  left: '50%',
  top: '50%',
  transform: 'translate(-50%, -50%)',
});

export const twitterTitle = style({
  color: 'white',
  display: 'flex',
  alignItems: 'center',

  gap: themeVars.spacing[4],
});

export const twitterBadge = style({
  width: '36px',
  height: '36px',
  position: 'relative',
  borderRadius: themeVars.borderRadius.lg,
  overflow: 'hidden',
});
