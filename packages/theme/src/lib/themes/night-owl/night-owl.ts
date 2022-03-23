import {buildExternalStylesheet} from '../../core';

const selection = '#1d3b53';
const foreground = '#80a4c2';
const punctuation = '#C792EA';
const tag = '#B2CCD6';

export const nightOwl = buildExternalStylesheet('nightOwl')(`
  .cm-selectionBackground,
  .cm-focused .cm-selectionBackground,
  &::selection,
  *::selection {
    background-color: ${selection};
  }

  .cm-selectionMatch {
    background-color: ${selection};
  }

  .cm-cursor {
    border-left-color: ${foreground};
  }

  .token.comment {
    color: rgb(99, 119, 119);
    font-style: italic;
  }

  .token.punctuation {
    color: ${punctuation};
  }

  .token.tag,
  .token.builtin,
  .token.namespace,
  .token.class-name,
  .token.class-name .token.constant {
    color: ${tag};
  }

  .token.symbol,
  .token.property {
    color: rgb(128, 203, 196);
  }

  .token.tag,
  .token.operator,
  .token.keyword {
    color: rgb(127, 219, 202);
  }

  .token.boolean {
    color: rgb(255, 88, 116);
  }

  .token.number {
    color: rgb(247, 140, 108);
  }

  .token.constant,
  .token.function,
  .token {
    color: rgb(130, 170, 255);
  }

  .token.selector,
  .token.doctype {
    color: rgb(199, 146, 234);
    font-style: italic;
  }

  .token.attr-name,
  .token.inserted {
    color: rgb(173, 219, 103);
    font-style: italic;
  }

  .token.string,
  .token.url,
  .token.entity,
  .language-css .token.string,
  .style .token.string {
    color: rgb(173, 219, 103);
  }

  .token.class-name,
  .token.atrule,
  .token.attr-value {
    color: rgb(255, 203, 139);
  }

  .token.regex,
  .token.important,
  .token.variable {
    color: rgb(214, 222, 235);
  }
`);
