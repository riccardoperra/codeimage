import {noGlobalKeyListener} from './rules/no-global-key-listener.mjs';
import {noComments} from './rules/no-comments.mjs';

export default {
  meta: {name: 'codeimage'},
  rules: {
    'no-global-key-listener': noGlobalKeyListener,
    'no-comments': noComments,
  },
};
