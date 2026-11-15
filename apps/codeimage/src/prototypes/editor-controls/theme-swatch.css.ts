import {createVar, fallbackVar, style} from '@vanilla-extract/css';
import {recipe} from '@vanilla-extract/recipes';

/** The theme's colours and the mark's size, which the component sets inline. */
export const swatchVars = {
  size: createVar('swatch-size'),
  width: createVar('swatch-width'),
  frame: createVar('swatch-frame'),
  window: createVar('swatch-window'),
  text: createVar('swatch-text'),
  base: createVar('swatch-base'),
  keyword: createVar('swatch-keyword'),
  string: createVar('swatch-string'),
  function: createVar('swatch-function'),
  number: createVar('swatch-number'),
  type: createVar('swatch-type'),
  property: createVar('swatch-property'),
  comment: createVar('swatch-comment'),
};

const v = swatchVars;
const size = fallbackVar(v.size, '56px');
const of = (factor: number) => `calc(${v.size} * ${factor})`;

export const swatch = recipe({
  base: {
    position: 'relative',
    display: 'inline-block',
    flex: 'none',
    width: size,
    height: size,
    borderRadius: '50%',
    overflow: 'hidden',
    background: v.window,
    // A ring in the theme's own text colour reads on dark and light windows.
    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${v.text} 16%, transparent), 0 1px 3px rgba(0, 0, 0, 0.24)`,
  },
  variants: {
    variant: {
      'syntax-orb': {
        selectors: {
          '&::after': {
            content: '',
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background:
              'radial-gradient(circle at 28% 22%, rgba(255, 255, 255, 0.32), transparent 46%)',
          },
        },
      },
      aa: {},
      window: {
        width: v.width,
        borderRadius: of(0.22),
        background: v.frame,
      },
    },
    wide: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      // As a card, the window keeps the default frame's shape, about 5 to 4,
      // with the frame's padding around it, a header and five lines of code.
      // Sizes follow the card through container units.
      variants: {variant: 'window', wide: true},
      style: {
        containerType: 'size',
        height: 'auto',
        aspectRatio: '5 / 4',
      },
    },
  ],
});

export const blob = recipe({
  base: {
    position: 'absolute',
    borderRadius: '50%',
    filter: `blur(${of(0.12)})`,
    opacity: 0.9,
  },
  variants: {
    token: {
      keyword: {inset: '-12% 38% 34% -12%', background: v.keyword},
      string: {inset: '22% -16% 8% 48%', background: v.string},
      function: {inset: '58% 26% -26% 6%', background: v.function},
    },
  },
});

export const aa = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: of(0.46),
  fontWeight: 600,
  lineHeight: 1,
  letterSpacing: '-0.02em',
});

export const editor = recipe({
  base: {
    position: 'absolute',
    inset: '20% 16%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: of(0.07),
    padding: '0 10%',
    borderRadius: of(0.1),
    background: v.window,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
  },
  variants: {
    wide: {
      true: {
        inset: '14% 12%',
        justifyContent: 'flex-start',
        gap: '6.5cqh',
        padding: '7cqh 8cqw',
        borderRadius: '5cqh',
      },
    },
  },
});

// The small mark keeps three lines and no header.
export const header = recipe({
  base: {display: 'none'},
  variants: {
    wide: {
      true: {display: 'flex', gap: '2.4cqw', marginBottom: '1.5cqh'},
    },
  },
});

export const dot = style({
  width: '3.8cqh',
  height: '3.8cqh',
  borderRadius: '50%',
  background: v.comment,
  opacity: 0.6,
});

export const line = recipe({
  base: {display: 'flex', gap: '6%'},
  variants: {
    indent: {true: {paddingLeft: '12%'}},
    long: {true: {}},
    wide: {true: {}, false: {}},
  },
  compoundVariants: [
    {variants: {long: true, wide: false}, style: {display: 'none'}},
  ],
});

export const bar = recipe({
  base: {
    height: of(0.055),
    minHeight: '2px',
    borderRadius: '999px',
  },
  variants: {
    wide: {true: {height: '4cqh'}},
  },
});
