import {noComments} from './rules/no-comments.mjs';

export default {
  meta: {name: 'codeimage'},
  rules: {
    'no-comments': noComments,
  },
};
