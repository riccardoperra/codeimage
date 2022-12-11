import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

export const activeColorVar = createVar();
export const disabledOpacity = createVar();

export const container = style([
  {
    margin: '4px',
    display: 'flex',
    alignItems: 'center',
    border: `1px solid rgb(24 24 27)`,
    backgroundColor: 'rgb(39 39 42 / 0.25)',
    placeContent: 'center flex-start',
    flexFlow: 'row nowrap',
    color: '#fff',
    gap: '96px',
    overflow: 'visible',
    flex: 1,
    position: 'relative',
    flexDirection: 'column',
    padding: '24px',
    borderRadius: '24px',
    transition: 'box-shadow .2s cubic-bezier(.4,0,.2,1)',
    userSelect: 'none',
    opacity: 0,
    selectors: {
      '&[data-active=true]': {
        opacity: 1,
        boxShadow: `rgb(255,255,255) 0px 0px 0px 0px, ${activeColorVar} 0px 0px 0px 3px, rgba(0,0,0,0) 0px 0px 0px 0px`,
      },
      '&[data-active=false]': {
        opacity: disabledOpacity,
      },
    },
    '@media': {
      '(min--moz-device-pixel-ratio:0)': {
        // Trying to simulate Chrome/Safari blurry effect with firefox
        backgroundColor: 'rgb(0 0 0 / 0.35)',
      },
    },
  },
  responsiveStyle({
    mobile: {
      vars: {
        [disabledOpacity]: '0',
      },
    },
    tablet: {
      vars: {
        [disabledOpacity]: '0.5',
      },
    },
  }),
]);
