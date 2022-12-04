import {createSprinkles, defineProperties} from '@vanilla-extract/sprinkles';
import {themeVars} from './global2.css';

export const responsiveProperties = defineProperties({
  properties: {
    display: {
      none: 'none',
      block: 'block',
      inline: 'inline',
      inlineBlock: 'inline-block',
      inlineFlex: 'inline-flex',
      flex: 'flex',
    },
    position: ['relative', 'absolute'],
    alignItems: {
      flexStart: 'flex-start',
      center: 'center',
      flexEnd: 'flex-end',
    },
    justifyContent: {
      flexStart: 'flex-start',
      center: 'center',
      flexEnd: 'flex-end',
      spaceBetween: 'space-between',
    },
    flexDirection: {
      row: 'row',
      rowReverse: 'row-reverse',
      column: 'column',
      columnReverse: 'column-reverse',
    },
    flexWrap: {
      wrap: 'wrap',
      nowrap: 'nowrap',
    },
    flexShrink: [0],
    flexGrow: [0, 1],
    textAlign: ['left', 'center', 'right'],
    paddingTop: themeVars.spacing,
    paddingBottom: themeVars.spacing,
    paddingLeft: themeVars.spacing,
    paddingRight: themeVars.spacing,
    marginTop: themeVars.spacing,
    marginBottom: themeVars.spacing,
    marginLeft: themeVars.spacing,
    marginRight: themeVars.spacing,
    width: ['100vw', '100%'],
    height: ['100vh', '100%'],
    borderRadius: themeVars.borderRadius,
    fontSize: themeVars.fontSize,
    lineHeight: themeVars.lineHeight,
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom'],
  },
});

const colorProperties = defineProperties({
  properties: {
    color: {
      primary: themeVars.dynamicColors.primary,
    },
    backgroundColor: [],
    // etc.
  },
});

export const sprinkles = createSprinkles(responsiveProperties, colorProperties);

export type Sprinkles = Parameters<typeof sprinkles>[0];
