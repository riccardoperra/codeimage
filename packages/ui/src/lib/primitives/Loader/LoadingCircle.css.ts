import {keyframes, style} from '@vanilla-extract/css';

export const spinner = keyframes({
  to: {
    transform: 'rotate(1turn)',
  },
});

export const loadingIcon = style({
  animation: `${spinner} 1s linear infinite`,
});

export const circle = style({
  opacity: '.25',
});

export const ring = style({
  opacity: '.75',
});
