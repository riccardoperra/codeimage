import {createVar, style} from '@vanilla-extract/css';
import {lchSupportStyle} from '~/theme/supportLch';

export const gradientBlue1 = {
  gradient1: createVar(),
  gradient2: createVar(),
  gradient3: createVar(),
  gradient4: createVar(),
};

export const gradientBlueBg = style([
  {
    background: `linear-gradient(140deg, ${gradientBlue1.gradient1}, ${gradientBlue1.gradient2}, ${gradientBlue1.gradient3}, ${gradientBlue1.gradient4})`,
    vars: {
      [gradientBlue1.gradient1]: 'rgb(9, 171, 241)',
      [gradientBlue1.gradient2]: 'rgb(5, 105, 148)',
      [gradientBlue1.gradient3]: 'rgb(4, 84, 118)',
      [gradientBlue1.gradient4]: 'rgb(6, 119, 167)',
    },
  },
  lchSupportStyle({
    vars: {
      [gradientBlue1.gradient1]: 'lch(55.426% 65 248.244)',
      [gradientBlue1.gradient2]: 'lch(41.146% 55 246.713)',
      [gradientBlue1.gradient3]: 'lch(32.877% 65 245.35)',
      [gradientBlue1.gradient4]: 'lch(46.456% 75 246.637)',
    },
  }),
]);

export const gradientPurpleBg = style([
  {
    background:
      'linear-gradient(to right top, #7f469d, #8242aa, #833db7, #8338c4, #8233d2, #8a35da, #9336e2, #9b38ea, #af41ee, #c24af2, #d554f7, #e65ffb)',
  },
  lchSupportStyle({
    background:
      'linear-gradient(to right top,' +
      'lch(39.843% 100 313.879),' +
      'lch(40.096% 90 312.655),' +
      'lch(40.024% 120 311.36),' +
      'lch(39.967% 114 310.184),' +
      'lch(39.967% 123 310.184),' +
      'lch(41.933% 128 309.574),' +
      'lch(43.867% 124 310.387), ' +
      'lch(45.792% 121 310.885), ' +
      'lch(50.11% 108 313.55),' +
      'lch(54.338% 109 316.277),' +
      'lch(58.787% 110 318.992),' +
      'lch(63.059% 106 321.566))',
  }),
]);

export const gradientPurpleDarkerBg = style([
  {
    background: 'linear-gradient(-45deg, #402662 0%, #8000FF 100%)',
  },
  lchSupportStyle({
    background:
      'linear-gradient(-45deg, lch(20% 55 306.256) 0%, lch(39.352% 132 308.054) 100%)',
  }),
]);
