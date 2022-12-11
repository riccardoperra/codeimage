import type {StyleRule} from '@vanilla-extract/css';
import {breakpoints} from './breakpoints';
import {mapValues, omit} from '../core/object';

type CSSProps = Omit<StyleRule, '@media' | '@supports'>;

const allowedBreakpoints = omit(breakpoints, ['mobile']);

export const breakpointQuery = mapValues(
  allowedBreakpoints,
  bp => `screen and (min-width: ${bp}px)`,
);

const makeMediaQuery =
  (breakpoint: keyof typeof breakpointQuery) => (styles?: CSSProps) =>
    !styles || Object.keys(styles).length === 0
      ? {}
      : {
          [breakpointQuery[breakpoint]]: styles,
        };

const mediaQuery = {
  tablet: makeMediaQuery('tablet'),
  desktop: makeMediaQuery('desktop'),
  wide: makeMediaQuery('wide'),
  wideLg: makeMediaQuery('wideLg'),
  wideXl: makeMediaQuery('wideXl'),
};

interface ResponsiveStyle {
  mobile?: CSSProps;
  tablet?: CSSProps;
  desktop?: CSSProps;
  wide?: CSSProps;
  wideLg?: CSSProps;
  wideXl?: CSSProps;
}

export const responsiveStyle = ({
  mobile,
  tablet,
  desktop,
  wide,
  wideLg,
  wideXl,
}: ResponsiveStyle): StyleRule => ({
  ...omit(mobile as StyleRule, ['@media']),
  ...(tablet || desktop || wide
    ? {
        '@media': {
          ...mediaQuery.tablet(tablet ?? {}),
          ...mediaQuery.desktop(desktop ?? {}),
          ...mediaQuery.wide(wide ?? {}),
          ...mediaQuery.wideLg(wideLg ?? {}),
          ...mediaQuery.wideXl(wideXl ?? {}),
        },
      }
    : {}),
});
