import {buildExternalStylesheet} from '../../core';

const selection = '#1d3b54';

export const holi = buildExternalStylesheet('holi')(`
  .cm-selectionBackground,
  .cm-focused .cm-selectionBackground,
  &::selection,
  *::selection {
    background-color: ${selection};
  }

  .cm-selectionMatch {
    background-color: ${selection};
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #446e69;
  }

  .token.punctuation {
    color: #d6b007;
  }

  .token.property,
  .token.tag,
  .token.boolean,
  .token.number,
  .token.constant,
  .token.symbol,
  .token.deleted {
    color: #d6e7ff;
  }

  .token.selector,
  .token.attr-name,
  .token.builtin,
  .token.inserted {
    color: #e60067;
  }

  .token.string,
  .token.char {
    color: #49c6ec;
  }

  .token.operator,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .style .token.string {
    color: #ec8e01;
    background: transparent;
  }

  .token.atrule,
  .token.attr-value,
  .token.keyword {
    color: #0fe468;
  }

  .token.function,
  .token.class-name {
    color: #78f3e9;
  }

  .token.regex,
  .token.important,
  .token.variable {
    color: #d6e7ff;
  }`);
