import {backgroundColorVar} from '@codeimage/ui';
import {createVar, style} from '@vanilla-extract/css';
import {responsiveStyle} from '~/theme/responsive';

const cardPadding = createVar();
const cardOuterRadius = createVar();

const cardInnerRadius = `calc(${cardOuterRadius} - ${cardPadding})`;

export const card = style([
  {
    border: `1px solid rgb(24 24 27)`,
    backgroundColor: 'rgb(39 39 42 / 0.25)',
    placeContent: 'center flex-start',
    alignItems: 'center',
    display: 'flex',
    flexFlow: 'row nowrap',
    gap: '96px',
    overflow: 'visible',
    position: 'relative',
    flexDirection: 'column',
    padding: cardPadding,
    flex: 1,
    vars: {
      [cardPadding]: '24px',
    },
  },
  responsiveStyle({
    mobile: {
      borderRadius: [cardOuterRadius],
      gap: '44px',
      minHeight: '512px',
      vars: {
        [cardOuterRadius]: '24px',
        [cardPadding]: '32px',
      },
    },
    desktop: {
      gap: '96px',
      flexDirection: 'row',
      minHeight: '564px',
      vars: {
        [cardOuterRadius]: '96px',
        [cardPadding]: '48px',
      },
    },
  }),
]);

export const content = style({
  display: 'flex',
  placeContent: 'center',
  alignItems: 'center',
  flexFlow: 'column nowrap',
  gap: '48px',
  overflow: 'hidden',
  padding: '0px',
  position: 'relative',
  textAlign: 'center',
  flex: 1,
});

export const imageSection = style([
  {
    flex: '0 0 auto',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: backgroundColorVar,
    opacity: 1,
    height: '300px',
    width: '100%',
    // @ts-expect-error No present in types. This is for safari absolute + overflow hidden bug
    '-webkitMaskImage':
      '-webkit-radial-gradient(circle, white 100%, black 100%)',
  },
  responsiveStyle({
    mobile: {
      borderRadius: '16px',
    },
    desktop: {
      height: '484px',
      flex: 1,
      borderRadius: cardInnerRadius,
    },
  }),
]);

export const imageWrapper = style({
  aspectRatio: '2 / 1',
  flex: '0 0 auto',
  borderRadius: `16px`,
  height: '568px',
  left: '48px',
  overflow: 'hidden',
  position: 'absolute',
  right: '-128px',
  top: '48px',
});
