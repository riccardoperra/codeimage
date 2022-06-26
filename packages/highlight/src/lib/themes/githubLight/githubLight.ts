import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import libColors from '@primer/primitives/dist/ts/colors/light';
import {defineEditorTheme} from '../../core';

export const githubLight = [
  defineEditorTheme({
    darkMode: false,
    cursor: {
      color: libColors.codemirror.cursor,
    },
    lineNumbers: {
      color: libColors.codemirror.linenumberText,
    },
    selection: {
      activeLine: libColors.codemirror.activelineBg,
      backgroundColor: libColors.codemirror.selectionBg,
      color: libColors.codemirror.text,
    },
    autocomplete: {
      background: libColors.checks.dropdownBg,
      border: libColors.checks.dropdownBorder,
      selectedBackground: libColors.checks.dropdownHoverBg,
      selectedColor: libColors.checks.dropdownHoverText,
    },
    highlight: {
      base: libColors.codemirror.text,
      background: libColors.codemirror.bg,
      tag: libColors.prettylights.syntax.entityTag,
      delimiters: libColors.ansi.white,
      numbers: libColors.prettylights.syntax.string,
      punctuation: libColors.scale.yellow[4],
      className: libColors.codemirror.syntax.variable,
      brackets: libColors.scale.yellow[4],
      keywords: libColors.prettylights.syntax.keyword,
      strings: libColors.prettylights.syntax.string,
      propertyName: libColors.prettylights.syntax.constantOtherReferenceLink,
      variableName: libColors.prettylights.syntax.variable,
      regexp: libColors.prettylights.syntax.stringRegexp,
      comments: libColors.prettylights.syntax.comment,
      attrName: libColors.prettylights.syntax.constant,
      function: libColors.prettylights.syntax.entity,
      typeName: libColors.prettylights.syntax.constant,
    },
  }),
  syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: t.definition(t.variableName),
        color: libColors.prettylights.syntax.constant,
      },
    ]),
  ),
];
