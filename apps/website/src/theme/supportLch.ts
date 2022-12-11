import {StyleRule} from '@vanilla-extract/css';

type CSSProps = Omit<StyleRule, '@media' | '@supports'>;

export function lchSupportStyle(props: CSSProps): StyleRule {
  return {
    '@supports': {
      '(color: lch(0% 0 0))': props,
    },
  };
}
