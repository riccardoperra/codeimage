import {themeVars} from '@codeimage/ui';
import {createVar, keyframes, style} from '@vanilla-extract/css';

export const sectionCount = createVar();
const sectionHeight = createVar();

export const sectionWrapper = style({
  backgroundColor: '#000',
  position: 'relative',
  display: 'flex',
  vars: {
    [sectionHeight]: '100vh',
    [sectionCount]: '3',
  },
});

export const content = style({
  maxWidth: '80rem',
  height: '200vh',
  position: 'relative',
  display: 'flex',
  margin: 'auto',
  '@media': {
    '(min-width: 1024px)': {
      padding: '400px 100px 100px',
      height: 'auto',
    },
  },
});

export const editorSectionInfo = style({
  marginLeft: 'auto',
  marginRight: 'auto',
  padding: '40px 0px 200px',
  paddingRight: themeVars.spacing[24],
  position: 'relative',
  overflow: 'hidden',
  order: -1,
  flex: 1,
});

export const sectionContainer = style({
  height: `100%`,
  display: 'flex',
  width: '100%',
});

export const textParallaxBox = style({
  display: 'flex',
  alignItems: 'center',
});

export const editorParallaxContent = style({
  display: 'flex',
  flexDirection: 'column',
  rowGap: '400px',
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
  width: `55%`,
  display: 'flex',
  alignItems: 'center',
  willChange: 'transform',
  zIndex: '1',
  left: '0px',
  filter: 'saturate(1.2)',
  height: '300px',
  bottom: 0,
  '@media': {
    '(min-width: 1024px)': {
      top: '50%',
      transform: 'translateY(-50%)',
      height: '500px',
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
  height: '500px',
  position: 'relative',
});

export const editorImageCardContainer = style({
  height: '500px',
  position: 'relative',
  flex: 1,
});

const editorImageCardBackdropFloating = keyframes({
  '0%': {
    filter: 'blur(500px) saturate(180%)',
  },
  '50%': {
    filter: 'blur(350px) saturate(180%)',
  },
  '100%': {
    filter: 'blur(500px) saturate(180%)',
  },
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
  animation: `${editorImageCardBackdropFloating} 6s ease-in-out infinite`,
});

///////////////////

export const fakeDropdown = style({
  position: 'absolute',
  width: '100%',
  height: '52px',
  boxShadow: themeVars.boxShadow.xl,
  backgroundColor: `#1a1a1a50`,
  overflow: 'hidden',
  borderRadius: themeVars.borderRadius.lg,
  zIndex: themeVars.zIndex['40'],
  rowGap: themeVars.spacing['1'],
  paddingLeft: themeVars.spacing['2'],
  paddingRight: themeVars.spacing['2'],
  display: 'flex',
  alignItems: 'center',
  left: '-15px',
  backdropFilter: 'blur(30px)',
  bottom: 0,
});

export const fakeGradient = style({
  borderRadius: themeVars.borderRadius.xl,
  width: '32px',
  height: '32px',
});
