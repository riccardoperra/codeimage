import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {themeVars} from '../../theme/global.css';
import {backgroundColorVar} from '../../theme/variables.css';
import {recipe} from '@vanilla-extract/recipes';

export const [terminalTheme, terminalVars] = createTheme({
  headerHeight: '50px',
  headerBackgroundColor: themeVars.backgroundColor.white,
  backgroundColor: themeVars.backgroundColor.white,
  textColor: themeVars.backgroundColor.gray['800'],
  boxShadow: themeVars.boxShadow.lg,
  tabDelta: '10px',
});

export const wrapper = style([
  terminalTheme,
  {
    position: 'relative',
    backgroundColor: terminalVars.backgroundColor,
    color: terminalVars.textColor,
    overflow: 'hidden',
    borderRadius: '12px',
    boxShadow: terminalVars.boxShadow,
    transition: 'box-shadow .2s',
  },
]);

export const content = style({
  position: 'relative',
  overflow: 'auto',
  fontSize: themeVars.fontSize.base,
  paddingBottom: themeVars.spacing['4'],
  paddingTop: themeVars.spacing['5'],
  paddingInlineStart: themeVars.spacing['4'],
  paddingInlineEnd: themeVars.spacing['4'],
});

export const header = style({
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  height: terminalVars.headerHeight,
  transition: 'background-color .2s ease-in-out',

  selectors: {
    '[data-theme-mode=light] &[data-accent-visible=true]': {
      backgroundColor: `rgba(0, 0, 0, .06)`,
    },
    '[data-theme-mode=dark] &[data-accent-visible=true]': {
      backgroundColor: `rgba(255, 255, 255, .06)`,
    },
  },
});

export const headerIconRow = style({
  selectors: {
    [`${header} &`]: {
      display: 'flex',
      paddingInlineStart: themeVars.spacing['4'],
      paddingInlineEnd: themeVars.spacing['4'],
      columnGap: themeVars.spacing['2'],
    },
  },
});

export const headerIconRowCircle = style({
  selectors: {
    [`${headerIconRow} &`]: {
      width: '15px',
      height: '15px',
      borderRadius: themeVars.borderRadius.full,
      backgroundColor: fallbackVar(
        backgroundColorVar,
        themeVars.backgroundColor.gray['500'],
      ),
    },
  },
});

export const tab = recipe({
  base: {
    background: 'transparent',
    padding: `0 ${themeVars.spacing['3']}`,
    paddingLeft: 0,
    fontSize: themeVars.fontSize.sm,
    borderRadius: `${themeVars.borderRadius.md} ${themeVars.borderRadius.md} 0 0`,
    position: 'relative',
  },
  variants: {
    accent: {
      true: {
        /**
         * ATTENTION: this is a workaround related to https://github.com/riccardoperra/codeimage/issues/41
         *            Flex properties in safari are broken on export with HtmlToImage
         */
        height: `calc(${terminalVars.headerHeight} - ${terminalVars.tabDelta})`,
        marginTop: 'auto',
        paddingTop: terminalVars.tabDelta,
        paddingLeft: themeVars.spacing['3'],
        backgroundColor: terminalVars.backgroundColor,

        selectors: {
          '&:before, &:after': {
            content: '',
            display: 'block',
            position: 'absolute',
            bottom: 0,
            backgroundColor: 'transparent',
            width: '8px',
            height: '8px',
            boxShadow: `1px 0px 0px 0px ${terminalVars.backgroundColor}, 3px 4px 0px 0px ${terminalVars.backgroundColor}`,
            overflow: 'hidden',
          },
        },
        ':before': {
          left: '-8px',
          borderBottomRightRadius: '8px',
        },
        ':after': {
          right: '-8px',
          borderBottomRightRadius: '12px',
          transform: 'scaleX(-1)',
        },
      },
    },
  },
});

export const tabIcon = style({
  display: 'inline-block',
  marginRight: themeVars.spacing['2'],
  verticalAlign: 'middle',
});
