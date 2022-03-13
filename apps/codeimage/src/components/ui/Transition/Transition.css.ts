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
