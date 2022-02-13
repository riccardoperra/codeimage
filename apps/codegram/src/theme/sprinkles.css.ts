import {createSprinkles, defineProperties} from '@vanilla-extract/sprinkles';
import {themeVars} from './global.css';

const responsiveProperties = defineProperties({
  conditions: {
    mobile: {},
    tablet: {'@media': 'screen and (min-width: 768px)'},
    desktop: {'@media': 'screen and (min-width: 1024px)'},
  },
  defaultCondition: 'mobile',
  properties: {
    display: ['none', 'flex'],
    position: ['relative'],
    flexDirection: ['row', 'column'],
    alignItems: ['stretch', 'flex-start', 'center', 'flex-end'],
    justifyContent: ['stretch', 'flex-start', 'center', 'flex-end'],
    gap: themeVars.spacing,
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
    textAlign: ['center'],
    boxShadow: themeVars.boxShadow,
  },
  shorthands: {
    padding: ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight'],
    paddingX: ['paddingLeft', 'paddingRight'],
    paddingY: ['paddingTop', 'paddingBottom'],
    margin: ['marginTop', 'marginBottom', 'marginLeft', 'marginRight'],
    marginX: ['marginLeft', 'marginRight'],
    marginY: ['marginTop', 'marginBottom'],
    placeItems: ['alignItems', 'justifyContent'],
    typeSize: ['fontSize', 'lineHeight'],
  },
});

const colorProperties = defineProperties({
  conditions: {
    lightMode: {},
    darkMode: {'@media': '(prefers-color-scheme: dark)'},
  },
  defaultCondition: 'lightMode',
  properties: {
    color: [],
    backgroundColor: [],
    // etc.
  },
});

export const sprinkles = createSprinkles(responsiveProperties, colorProperties);
