import {Extension} from '@codemirror/state';
import {EditorView} from '@codemirror/view';

interface CustomFontExtensionOptions {
  fontName: string;
  fontWeight: number;
}

export const createCustomFontExtension = (
  options: CustomFontExtensionOptions,
): Extension => {
  return EditorView.theme({
    '.cm-content *': {
      fontFamily: `${options.fontName}, monospace`,
      fontWeight: options.fontWeight,
      fontVariantLigatures: 'normal',
    },
    '.cm-gutters': {
      fontFamily: `${options.fontName}, monospace`,
      fontWeight: 400,
      fontVariantLigatures: 'normal',
    },
  });
};
