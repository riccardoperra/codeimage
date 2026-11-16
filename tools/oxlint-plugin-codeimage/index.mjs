import {noStaticInlineStyle} from './rules/no-static-inline-style.mjs';
import {noDocumentQuery} from './rules/no-document-query.mjs';
import {noGlobalKeyListener} from './rules/no-global-key-listener.mjs';
import {noComments} from './rules/no-comments.mjs';

export default {
  meta: {name: 'codeimage'},
  rules: {
    'no-static-inline-style': noStaticInlineStyle,
    'no-document-query': noDocumentQuery,
    'no-global-key-listener': noGlobalKeyListener,
    'no-comments': noComments,
  },
};
