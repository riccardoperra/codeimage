import {themeVars} from '@codeimage/ui';
import {createTheme, fallbackVar, style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';
import {terminalVars} from '../../terminal.css';

export const [tabTheme, tabVars] = createTheme({
  tabHeight: '30px',
  tabIndex: '0',
  tabSecondaryHoverBg: '255, 255, 255',
  tabGap: '8px',
  tabMaxWidth: '400px',
  textColor: fallbackVar(terminalVars.tabTextColor, terminalVars.textColor),
  accentActiveBackground: terminalVars.tabAccentActiveBackground,
  accentInactiveBackground: terminalVars.tabAccentInactiveBackground,
  tabForeground: terminalVars.tabAccentActiveBackground,
});

export const wrapper = recipe({
  base: [
    tabTheme,
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
      columnGap: tabVars.tabGap,
    },
    '[data-accent-visible=true] &': {
      paddingLeft: tabVars.tabGap,
    },
  },
});

export const tab = recipe({
  base: [
    {
      background: 'transparent',
      height: tabVars.tabHeight,
      color: tabVars.textColor,
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
      maxWidth: tabVars.tabMaxWidth,
      minWidth: '0px',
      flex: '0 1 auto',
    },
    {
      selectors: {
        '&[data-active-drag=true]': {
          zIndex: 21,
          backdropFilter: 'blur(20px) saturate(180%)',
          ['webkitBackdropFilter' as string]: 'blur(20px) saturate(180%)',
        },
        '[data-theme-mode=dark] &': {
          vars: {
            [tabVars.tabSecondaryHoverBg]: '255, 255, 255',
          },
        },
        '[data-theme-mode=light] &': {
          vars: {
            [tabVars.tabSecondaryHoverBg]: '0, 0, 0',
          },
        },
      },
    },
  ],
  variants: {
    accent: {
      true: {
        vars: {
          [tabVars.tabForeground]: fallbackVar(
            terminalVars.tabAccentActiveBackground,
            terminalVars.backgroundColor,
          ),
        },
        /**
         * ATTENTION: this is a workaround related to https://github.com/riccardoperra/codeimage/issues/41
         *            Flex properties in safari are broken on export with HtmlToImage
         */
        height: `calc(${terminalVars.headerHeight} - ${terminalVars.tabDelta})`,
        marginTop: 'auto',
        marginBottom: 0,
        paddingTop: 0,
        paddingLeft: `calc(${themeVars.spacing['2']} + ${tabVars.tabGap})`,
        backgroundColor: tabVars.tabForeground,
        boxShadow: '1px 10px 5px 1px rgba(0,0,0,.25)',
        zIndex: tabVars.tabIndex,
        selectors: {
          '&:first-child': {
            marginRight: `calc(${tabVars.tabGap} * -1)`,
          },
          '&:first-child:last-child': {
            marginRight: tabVars.tabGap,
            filter: 'unset',
          },
          '&:nth-child(n + 2)': {
            marginRight: `calc(${tabVars.tabGap} * -1)`,
          },
          '&:nth-child(n + 2):last-child': {
            marginRight: tabVars.tabGap,
          },
          '&:before, &:after': {
            content: '',
            display: 'block',
            position: 'absolute',
            bottom: 0,
            backgroundColor: 'transparent',
            width: tabVars.tabGap,
            height: tabVars.tabGap,
            boxShadow: `1px 0px 0px 0px ${tabVars.tabForeground}, 3px 4px 0px 0px ${tabVars.tabForeground}`,
            overflow: 'hidden',
          },
        },
        ':before': {
          left: `calc(${tabVars.tabGap} * -1)`,
          borderBottomRightRadius: tabVars.tabGap,
        },
        ':after': {
          right: `calc(${tabVars.tabGap} * -1)`,
          borderBottomRightRadius: '12px',
          transform: 'scaleX(-1)',
        },
      },
      false: {
        borderRadius: themeVars.borderRadius.lg,

        ':hover': {
          background: `rgba(${tabVars.tabSecondaryHoverBg}, .03)`,
        },
      },
    },
    active: {
      true: {
        minWidth: 'unset',
      },
      // Needed to generate compound variants
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
        background: `rgba(${tabVars.tabSecondaryHoverBg}, .10)`,
        ':hover': {
          background: `rgba(${tabVars.tabSecondaryHoverBg}, .15)`,
        },
      },
    },
    {
      variants: {
        accent: true,
        active: false,
      },
      style: {
        vars: {
          [tabVars.tabForeground]: fallbackVar(
            tabVars.accentInactiveBackground,
            terminalVars.backgroundColor,
          ),
        },
        selectors: {
          '&:not(:first-child) &': {
            borderTopLeftRadius: 0,
          },
          '&:nth-child(n + 2)': {
            paddingLeft: `calc(${themeVars.spacing['2']} + ${tabVars.tabGap})`,
          },
          '&:not(:last-child)': {
            borderTopRightRadius: 0,
          },
          '[data-fallback-inactive-tab=true] &': {
            filter: 'brightness(0.85)',
          },
        },
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
    },
    '[data-theme-mode=light] &': {
      color: themeVars.backgroundColor.black,
    },
  },
  ':active': {
    backgroundColor: `rgba(${tabVars.tabSecondaryHoverBg}, .25)`,
  },
  ':focus': {
    backgroundColor: `rgba(${tabVars.tabSecondaryHoverBg}, .25)`,
  },
  ':hover': {
    backgroundColor: `rgba(${tabVars.tabSecondaryHoverBg}, .10)`,
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
