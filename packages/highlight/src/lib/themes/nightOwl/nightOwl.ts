import {ThemeJsonDefinition} from '../../core';

const palette = {
  white: '#D0D8E5',
  yellow: '#ffcb8b',
  yellow2: '#e2b93d',
  purple: '#c792ea',
  cyan: '#80CBC4',
  indigo: '#82AAFF',
  gray: '#5f7e97',
  red: '#ff5874',
  green: '#c5e478',
  blue: '#5ca7e4',
  greenLight: '#caece6',
  orange: '#F78C6C',
  grayDark: '#637777',
  lineNumbers: '#4b6479',
  selection: '#1d3b53',
};

export const nightOwl: ThemeJsonDefinition = [
  {
    type: 'themeOption',
    data: {
      darkMode: true,
      selection: {
        backgroundColor: palette.selection,
        color: palette.white,
      },
      cursor: {
        color: palette.white,
      },
      lineNumbers: {
        color: palette.lineNumbers,
      },
      autocomplete: {
        background: '#011423',
        border: '#5f7e97',
        selectedBackground: '#011220',
        selectedColor: palette.orange,
      },
      highlight: {
        className: palette.yellow,
        typeName: palette.green,
        propertyName: palette.indigo,
        keywords: palette.purple,
        delimiters: palette.gray,
        boolean: palette.red,
        strings: palette.yellow,
        regexp: palette.blue,
        tag: palette.greenLight,
        comments: palette.grayDark,
        variableName: palette.indigo,
        annotation: palette.purple,
        base: palette.white,
        numbers: palette.orange,
        paren: palette.yellow2,
        function: palette.indigo, // function name,
      },
    },
  },
];
