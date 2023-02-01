import {keyframes, style} from '@vanilla-extract/css';

const scrollDownAnimation = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translate(0, 0)',
  },
  '40%': {
    opacity: 1,
  },
  '80%': {
    opacity: 0,
    transform: 'translate(0, 20px)',
  },
  '100%': {
    opacity: 0,
  },
});

export const scrollDown = style({
  border: '2px solid #fff',
  borderRadius: '20px',
  height: '35px',
  width: '20px',
  margin: 'auto',
  '::before': {
    backgroundColor: '#fff',
    borderRadius: '100%',
    content: '',
    height: '6px',
    left: 0,
    margin: '0 auto',
    position: 'absolute',
    right: 0,
    top: '6px',
    width: '6px',
    animation: `${scrollDownAnimation} 2s infinite`,
  },
});
