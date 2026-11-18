import {useI18n} from '@codeimage/locale';
import {getUiStore} from '@codeimage/store/ui';
import {defaultKeymap, history, historyKeymap} from '@codemirror/commands';
import {json} from '@codemirror/lang-json';
import {
  bracketMatching,
  HighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {EditorView, keymap, lineNumbers} from '@codemirror/view';
import {tags} from '@lezer/highlight';
import {createCodeMirror, createEditorControlledValue} from 'solid-codemirror';
import type {AppLocaleEntries} from '../../../i18n';
import * as styles from './formatting-json.css';

const highlighting = syntaxHighlighting(
  HighlightStyle.define([
    {tag: tags.propertyName, class: styles.key},
    {tag: tags.string, class: styles.string},
    {tag: [tags.number, tags.bool, tags.null], class: styles.literal},
  ]),
);

interface Props {
  value: string;
  readOnly: boolean;
  invalid: boolean;
  onChange: (value: string) => void;
}

export function FormattingJsonInput(props: Props) {
  const [t] = useI18n<AppLocaleEntries>();
  const ui = getUiStore();
  const value = () => props.value.replace(/\r\n?/g, '\n');
  const {editorView, ref, createExtension} = createCodeMirror({
    get value() {
      return value();
    },
    onValueChange(next) {
      if (next !== value()) props.onChange(next);
    },
  });

  createEditorControlledValue(editorView, value);
  createExtension([
    json(),
    highlighting,
    lineNumbers(),
    bracketMatching(),
    history(),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    EditorView.editorAttributes.of({class: styles.input}),
  ]);
  createExtension(() => EditorView.darkTheme.of(ui.currentTheme() === 'dark'));
  createExtension(() => [
    EditorState.readOnly.of(props.readOnly),
    EditorView.editable.of(!props.readOnly),
    EditorView.contentAttributes.of({
      'aria-label': t('formatting.jsonConfig'),
      'aria-invalid': String(props.invalid),
      'aria-readonly': String(props.readOnly),
      'aria-multiline': 'true',
      spellcheck: 'false',
    }),
  ]);

  return <div ref={element => ref(element)} />;
}
