import {style} from '@vanilla-extract/css';
export const content = style({
  selectors: {
    '[data-static-code-view].cm-editor &.cm-content': {whiteSpace: 'pre'},
  },
});
