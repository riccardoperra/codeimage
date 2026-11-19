import {keyframes, style} from '@vanilla-extract/css';

const fadeEnter = keyframes({from: {opacity: 0}, to: {opacity: 1}});
const fadeLeave = keyframes({from: {opacity: 1}, to: {opacity: 0}});
const scaleEnter = keyframes({
  from: {opacity: 0, transform: 'scale(.95)'},
  to: {opacity: 1, transform: 'scale(1)'},
});
const scaleLeave = keyframes({
  from: {opacity: 1, transform: 'scale(1)'},
  to: {opacity: 0, transform: 'scale(.95)'},
});

export const fadeDuration = 200;
export const scaleDuration = 225;

function transition(
  enter: string,
  leave: string,
  duration: number,
  ease: string,
) {
  return style({
    selectors: {
      '&[data-transition="enter"]': {
        animation: `${enter} ${duration}ms ${ease} both`,
      },
      '&[data-transition="leave"]': {
        animation: `${leave} ${duration}ms ${ease} both`,
        pointerEvents: 'none',
      },
    },
    '@media': {
      '(prefers-reduced-motion: reduce)': {
        selectors: {
          '&[data-transition]': {animationDuration: '0ms'},
        },
      },
    },
  });
}

export const fadeInOut = transition(
  fadeEnter,
  fadeLeave,
  fadeDuration,
  'ease-in-out',
);
export const fadeInOutWithScale = transition(
  scaleEnter,
  scaleLeave,
  scaleDuration,
  'cubic-bezier(0.4, 0, 0.2, 1)',
);
