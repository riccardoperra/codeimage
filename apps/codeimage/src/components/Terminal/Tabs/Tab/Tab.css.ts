import {themeVars} from '@codeimage/ui';
import {createTheme, style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';
import {terminalVars} from '../../terminal.css';

export const [tabTheme, tabVars] = createTheme({
  tabHeight: '30px',
  tabIndex: '0',
  tabSecondaryButtonHoverBg: '255, 255, 255',
});

export const wrapper = recipe({
  base: [
    {
      display: 'flex',
      width: '100%',
      alignItems: 'center',
      marginRight: themeVars.spacing['2'],
      overflow: 'hidden',
      marginLeft: themeVars.spacing['2'],
    },
  ],
  variants: {
    accent: {
      true: {
        marginTop: 'auto',
      },
    },
  },
});

export const tabListWrapper = style({
  display: 'flex',
  overflow: 'hidden',
  marginRight: themeVars.spacing['1'],
  paddingLeft: themeVars.spacing['2'],
  transition: 'all 150ms ease-in-out',
  selectors: {
    '[data-accent-visible=false] &': {
      columnGap: '8px',
    },
    '[data-accent-visible=true] &': {
      paddingLeft: '8px',
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
      transition: 'width 150ms ease-in-out, height 50ms ease-in-out',
      maxWidth: '400px',
      minWidth: '0px',
      flex: '0 1 auto',
    },
    {
      selectors: {
        '&[data-active-drag=true]': {
          zIndex: 21,
          backdropFilter: 'blur(20px) saturate(180%)',
        },
      },
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
        zIndex: tabVars.tabIndex,
        selectors: {
          '&:first-child': {
            marginRight: '-8px',
          },
          '&:first-child:last-child': {
            marginRight: '8px',
            filter: 'unset',
          },
          '&:nth-child(n + 2)': {
            marginRight: '-8px',
            paddingLeft: `calc(${themeVars.spacing['3']} + 8px)`,
          },
          '&:nth-child(n + 2):last-child': {
            marginRight: '8px',
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
      false: {},
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
        active: false,
      },
      style: {
        // TODO: polished could be needed
        backgroundColor: `${terminalVars.backgroundColor}`,
        selectors: {
          '&:not(:first-child) &': {
            borderTopLeftRadius: 0,
          },
          '[data-active=true] &': {
            marginLeft: '-8px',
          },
          '&:not(:last-child)': {
            borderTopRightRadius: 0,
          },
        },
        filter: 'brightness(0.80)',
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
  minWidth: '14px',
  selectors: {
    '[data-theme-mode=dark] &': {
      color: themeVars.backgroundColor.white,
      vars: {
        [tabVars.tabSecondaryButtonHoverBg]: '255, 255, 255',
      },
    },
    '[data-theme-mode=light] &': {
      color: themeVars.backgroundColor.black,
      vars: {
        [tabVars.tabSecondaryButtonHoverBg]: '0, 0, 0',
      },
    },
  },
  ':active': {
    backgroundColor: `rgba(${tabVars.tabSecondaryButtonHoverBg}, .25)`,
  },
  ':focus': {
    backgroundColor: `rgba(${tabVars.tabSecondaryButtonHoverBg}, .25)`,
  },
  ':hover': {
    backgroundColor: `rgba(${tabVars.tabSecondaryButtonHoverBg}, .10)`,
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
  lineHeight: '14px',
  marginRight: themeVars.spacing['2'],
  opacity: '.50',
});
