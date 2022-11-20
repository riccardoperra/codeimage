import {backgroundColorVar} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';

export const sectionWrapper = style({
  backgroundColor: '#000',
  height: '200vh',
  '@media': {
    '(min-width: 748px)': {
      height: '300vh',
    },
  },
  position: 'relative',
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

export const stickyContent = style({
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
