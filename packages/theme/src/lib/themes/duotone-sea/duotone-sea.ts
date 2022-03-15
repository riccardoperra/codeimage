import {buildExternalStylesheet} from '../../core';

export const duotoneSea = buildExternalStylesheet('duotone-sea')(`
  .token.comment,
  .token.prolog,
  .token.doctype,
  .token.cdata {
    color: #4a5f78;
  }

  .token.punctuation {
    color: #4a5f78;
  }

  .token.namespace {
    opacity: .7;
  }

  .token.tag,
  .token.operator,
  .token.number {
    color: #0aa370;
  }

  .token.property,
  .token.function {
    color: #57718e;
  }

  .token.tag-id,
  .token.selector,
  .token.atrule-id {
    color: #ebf4ff;
  }

  code.language-javascript,
  .token.attr-name {
    color: #7eb6f6;
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
    color: #47ebb4;
  }

  .token.placeholder,
  .token.variable {
    color: #47ebb4;
  }

  .token.deleted {
    text-decoration: line-through;
  }

  .token.inserted {
    border-bottom: 1px dotted #ebf4ff;
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
    color: #7eb6f6;
  }

  .token.entity {
    cursor: help;
  }
`);
