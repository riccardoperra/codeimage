import {buildExternalStylesheet} from '../../core';

const selection = '#5b5b7b';
const foreground = '#f8f8f2';

export const duotoneDark = buildExternalStylesheet('duotone-dark')(`
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

  .cm-lineNumbers .cm-gutterElement {
    color: #FFFFFF;
  }

  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #6c6783;
  }

  .token.punctuation {
    color: #6c6783;
  }

  .token.namespace {
    opacity: .7;
  }

  .token.tag,
  .token.operator,
  .token.number {
    color: #e09142;
  }

  .token.property,
  .token.property-name,
  .token.function {
    color: #9a86fd;
  }

  .token.tag-id,
  .token.selector,
  .token.atrule-id {
    color: #eeebff;
  }

  code.language-javascript,
  .token.attr-name {
    color: #c4b9fe;
  }

  code.language-css,
  code.language-scss,
  .token.boolean,
  .token.string,
  .token.entity,
  .token.url,
  .language-css .token.string,
  .language-scss .token.string,
  .style .token.string,
  .token.attr-value,
  .token.keyword,
  .token.control,
  .token.directive,
  .token.unit,
  .token.statement,
  .token.regex,
  .token.atrule {
    color: #ffcc99;
  }

  .token.placeholder,
  .token.variable {
    color: #ffcc99;
  }

  .token.deleted {
    text-decoration: line-through;
  }

  .token.inserted {
    border-bottom: 1px dotted #eeebff;
    text-decoration: none;
  }

  .token.italic {
    font-style: italic;
  }

  .token.important,
  .token.bold {
    font-weight: bold;
  }

  .token.important {
    color: #c4b9fe;
  }

  .token.entity {
    cursor: help;
  }
`);
