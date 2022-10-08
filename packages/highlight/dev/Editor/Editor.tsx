import {backgroundColorVar, Box, colorVar} from '@codeimage/ui';
import {javascript} from '@codemirror/lang-javascript';
import {Extension} from '@codemirror/state';
import {EditorView, lineNumbers} from '@codemirror/view';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createCodeMirror,
  createEditorControlledValue,
  createEditorReadonly,
} from 'solid-codemirror';
import {createEffect, on, onMount, VoidProps} from 'solid-js';
import {CustomTheme} from '../../src/lib/core';
import {editor} from './Editor.css';

interface CustomEditorPreviewProps {
  code: string;
  theme: CustomTheme;
}

export default function Editor(props: VoidProps<CustomEditorPreviewProps>) {
  const {editorView, ref: setEditorRef, createExtension} = createCodeMirror();
  createEditorControlledValue(editorView, () => props.code);
  createEditorReadonly(editorView, () => true);

  const previewEditorBaseTheme = () =>
    EditorView.theme({
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

  const extensions = (): Extension => {
    return [
      previewEditorBaseTheme(),
      props.theme.editorTheme,
      lineNumbers(),
      EditorView.lineWrapping,
      javascript({
        jsx: true,
        typescript: true,
      }),
    ];
  };

  const reconfigure = createExtension(extensions());

  createEffect(on(extensions, extensions => reconfigure(extensions)));

  return (
    <Box
      class={editor}
      style={assignInlineVars({
        [backgroundColorVar]: props.theme.properties.terminal.main,
        [colorVar]: props.theme.properties.terminal.text,
      })}
    >
      <div
        aria-readonly={true}
        ref={el => {
          onMount(() => {
            setEditorRef(el);
          });
        }}
      />
    </Box>
  );
}
