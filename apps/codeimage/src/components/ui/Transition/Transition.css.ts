import {style} from '@vanilla-extract/css';

export const fadeInOut = {
  enter: style({
    transitionDuration: '200ms',
  }),
  enterTo: style({
    opacity: 1,
  }),
  enterFrom: style({
    opacity: 0,
  }),
  leave: style({
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-in-out',
  }),
  leaveFrom: style({
    opacity: 1,
  }),
  leaveTo: style({
    opacity: 0,
  }),
};

export const fadeInOutWithScale = {
  enter: style({
    transitionTimingFunction: 'ease-out',
    transitionDuration: '200ms',
  }),
  enterTo: style({
    opacity: 1,
    transform: `scale(1)`,
  }),
  enterFrom: style({
    opacity: 0,
    transform: `scale(.95)`,
  }),
  leave: style({
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-in',
  }),
  leaveFrom: style({
    opacity: 1,
    transform: `scale(1)`,
  }),
  leaveTo: style({
    opacity: 0,
    transform: `scale(.95)`,
  }),
};
