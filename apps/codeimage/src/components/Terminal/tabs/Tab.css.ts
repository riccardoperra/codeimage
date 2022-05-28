import {themeVars} from '@codeimage/ui';
import {createTheme} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';
import {terminalVars} from '../terminal.css';

export const [tabTheme, tabVars] = createTheme({});

export const wrapper = recipe({
  base: {
    display: 'flex',
    width: '100%',
  },
  variants: {
    accent: {
      true: {},
      false: {},
    },
    multi: {
      true: {},
      false: {},
    },
  },
});

export const tab = recipe({
  base: {
    background: 'transparent',
    padding: `0 ${themeVars.spacing['3']}`,
    verticalAlign: 'middle',
    marginTop: 'auto',
    marginBottom: 'auto',
    paddingLeft: 0,
    fontSize: themeVars.fontSize.sm,
    borderRadius: `${themeVars.borderRadius.md} ${themeVars.borderRadius.md} 0 0`,
    position: 'relative',
    lineHeight: 1,
  },
  variants: {
    clickable: {
      true: {
        cursor: 'pointer',
      },
    },
    accent: {
      true: {
        /**
         * ATTENTION: this is a workaround related to https://github.com/riccardoperra/codeimage/issues/41
         *            Flex properties in safari are broken on export with HtmlToImage
         */
        height: `calc(${terminalVars.headerHeight} - ${terminalVars.tabDelta})`,
        marginTop: 'auto',
        marginBottom: 0,
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
    active: {
      true: {},
    },
  },
  compoundVariants: [
    {
      variants: {
        accent: false,
        active: true,
      },
      style: {
        borderRadius: themeVars.borderRadius.lg,
        background: 'rgba(255,255,255, .10)',
        padding: `4px 12px`,
      },
    },
  ],
});
