import {themeVars} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';
import {terminalVars} from '../terminal.css';

export const [tabTheme, tabVars] = createTheme({
  tabHeight: '30px',
});

export const wrapper = recipe({
  base: [
    {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      marginRight: themeVars.spacing['2'],
      overflow: 'hidden',
    },
  ],
  variants: {
    accent: {
      true: {
        marginTop: 'auto',
      },
      false: {},
    },
    multi: {
      true: {},
      false: {},
    },
  },
});

export const tabListWrapper = style({
  display: 'flex',
  overflow: 'hidden',
  marginRight: themeVars.spacing['1'],
  transition: 'all 150ms ease-in-out',
  selectors: {
    '[data-accent-visible=false] &': {
      columnGap: '8px',
    },
  },
});

export const tab = recipe({
  base: [
    tabTheme,
    {
      background: 'transparent',
      height: tabVars.tabHeight,
      padding: `0px ${themeVars.spacing['3']}`,
      verticalAlign: 'middle',
      marginTop: 'auto',
      marginBottom: 'auto',
      fontSize: themeVars.fontSize.sm,
      borderRadius: `${themeVars.borderRadius.md} ${themeVars.borderRadius.md} 0 0`,
      position: 'relative',
      lineHeight: tabVars.tabHeight,
      display: 'flex',
      alignItems: 'center',
      transition:
        'width 150ms ease-in-out, margin 100ms ease-out, height 50ms ease-in-out',
      maxWidth: '400px',
      minWidth: '0px',
      flex: '0 1 auto',
    },
  ],
  variants: {
    accent: {
      true: {
        /**
         * ATTENTION: this is a workaround related to https://github.com/riccardoperra/codeimage/issues/41
         *            Flex properties in safari are broken on export with HtmlToImage
         */
        height: `calc(${terminalVars.headerHeight} - ${terminalVars.tabDelta})`,
        marginTop: 'auto',
        marginBottom: 0,
        paddingTop: 0,
        paddingLeft: themeVars.spacing['3'],
        backgroundColor: terminalVars.backgroundColor,
        boxShadow: '0px 10px 10px 0 rgba(0,0,0,.30)',

        ':first-child': {
          borderTopRightRadius: 0,
          marginRight: '4px',
        },
        selectors: {
          '&:nth-child(1)': {
            marginRight: '-8px',
          },
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
      false: {
        borderRadius: themeVars.borderRadius.lg,

        ':hover': {
          background: 'rgba(255,255,255, .03)',
        },
      },
    },
    active: {
      true: {
        minWidth: 'unset',
      },
    },
  },
  compoundVariants: [
    {
      variants: {
        accent: false,
        active: true,
      },
      style: {
        background: 'rgba(255,255,255, .10)',
        ':hover': {
          background: 'rgba(255,255,255, .15)',
        },
      },
    },
    {
      variants: {
        accent: true,
        active: true,
      },
      style: {
        zIndex: 10,
      },
    },
    {
      variants: {
        accent: true,
        active: false,
      },
      style: {
        // TODO: polished could be needed
        backgroundColor: `${terminalVars.backgroundColor}`,
        filter: 'brightness(0.90)',
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      },
    },
  ],
});

export const tabCloseIcon = style({
  marginLeft: themeVars.spacing['1'],
  fontWeight: themeVars.fontWeight.semibold,
  borderRadius: themeVars.borderRadius.full,
  cursor: 'pointer',
  width: '14px',
  display: 'inline-block',
  height: '14px',
  ':hover': {
    background: 'rgba(255,255,255, .15)',
  },
  ':focus': {
    background: 'rgba(255,255,255, .25)',
  },
  ':active': {
    background: 'rgba(255,255,255, .25)',
  },
});

export const tabTextContent = style({
  marginTop: 'auto',
  marginBottom: 'auto',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

export const fallbackText = style({
  fontSize: '14px',
  opacity: '.50',
  fontWeight: 'normal',
});
