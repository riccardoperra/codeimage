import {HighlightStyle, syntaxHighlighting} from '@codemirror/language';
import {tags as t} from '@lezer/highlight';
import libColors from '@primer/primitives/dist/ts/colors/dark_dimmed';
import {defineEditorTheme} from '../../core';

export const githubDarkDimmed = [
  defineEditorTheme({
    darkMode: true,
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
      punctuation: libColors.scale.yellow[1],
      className: libColors.codemirror.syntax.variable,
      brackets: libColors.scale.yellow[1],
      keywords: libColors.prettylights.syntax.keyword,
      strings: libColors.prettylights.syntax.string,
      propertyName: libColors.prettylights.syntax.entity,
      variableName: libColors.codemirror.text,
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
        color: libColors.codemirror.text,
      },
    ]),
  ),
];
