import {backgroundColorVar, Box, colorVar} from '@codeimage/ui';
import {javascript} from '@codemirror/lang-javascript';
import {EditorView, lineNumbers} from '@codemirror/view';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {createCodeMirror, createEditorControlledValue} from 'solid-codemirror';
import type {VoidProps} from 'solid-js';
import {untrack} from 'solid-js';
import type {CustomTheme} from '../../src/lib/core';
import {editor} from './Editor.css';

interface CustomEditorPreviewProps {
  code: string;
  theme: CustomTheme;
}

const previewEditorBaseTheme = EditorView.theme({
  '&': {
    textAlign: 'left',
    fontSize: '16px',
    background: 'transparent',
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    border: 'none',
  },
  '.cm-line': {
    padding: '0 2px 6px 16px',
  },
  '.cm-content *': {
    fontFamily: `Jetbrains Mono, monospace`,
    fontWeight: 400,
    fontVariantLigatures: 'normal',
  },
});

export default function Editor(props: VoidProps<CustomEditorPreviewProps>) {
  const {
    editorView,
    ref: setEditorRef,
    createExtension,
  } = createCodeMirror({
    value: untrack(() => props.code),
    extensions: [
      previewEditorBaseTheme,
      lineNumbers(),
      EditorView.lineWrapping,
      javascript({
        jsx: true,
        typescript: true,
      }),
    ],
  });
  createEditorControlledValue(editorView, () => props.code);
  createExtension(() => props.theme.editorTheme);

  return (
    <Box
      class={editor}
      style={assignInlineVars({
        [backgroundColorVar]: props.theme.properties.terminal.main,
        [colorVar]: props.theme.properties.terminal.text,
      })}
    >
      <div ref={setEditorRef} />
    </Box>
  );
}
