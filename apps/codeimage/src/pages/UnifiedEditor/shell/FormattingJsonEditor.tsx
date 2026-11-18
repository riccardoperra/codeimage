import {useI18n} from '@codeimage/locale';
import {
  formattingJson,
  maxFormattingJsonSize,
  parseFormattingJson,
} from '@codeimage/store/editor/formatting-json';
import {Button, TextArea} from '@codeui/kit';
import {createMemo, createSignal, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import * as styles from './formatting-json.css';

export function FormattingJsonEditor() {
  const [t] = useI18n<AppLocaleEntries>();
  const [draft, setDraft] = createSignal<string>();
  const [reading, setReading] = createSignal(false);
  const [feedback, setFeedback] = createSignal<
    'fileError' | 'tooLarge' | 'storageError' | 'saved'
  >();
  const value = () => draft() ?? formattingJson.source() ?? '{}';
  const parsed = createMemo(() => parseFormattingJson(value()));
  const pending = () => reading() || formattingJson.busy();
  let fileInput: HTMLInputElement | undefined;

  function edit(source: string) {
    setFeedback(undefined);
    setDraft(source);
  }

  async function readFile(file: File) {
    if (file.size > maxFormattingJsonSize) {
      setFeedback('tooLarge');
      return;
    }
    setReading(true);
    try {
      edit((await file.text()).replace(/^\uFEFF/, ''));
    } catch {
      setFeedback('fileError');
    } finally {
      setReading(false);
    }
  }

  async function save() {
    setFeedback(
      (await formattingJson.save(value())) ? 'saved' : 'storageError',
    );
  }

  async function clear() {
    if (!(await formattingJson.clear())) setFeedback('storageError');
  }

  const error = () => {
    const issue = parsed();
    switch (issue.kind) {
      case 'valid':
        return undefined;
      case 'syntax':
        return t('formatting.jsonSyntax');
      case 'tooLarge':
        return t('formatting.tooLarge');
      case 'unknownOption':
        return t('formatting.unknownOption', {name: issue.name});
      case 'invalidOption':
        return t('formatting.invalidOption', {name: issue.name});
    }
  };

  const message = () => {
    const status = feedback();
    return status ? t(`formatting.${status}`) : error();
  };

  return (
    <div class={styles.editor}>
      <TextArea
        size="md"
        ref={input => {
          input.rows = 9;
          input.spellcheck = false;
        }}
        value={value()}
        onChange={edit}
        disabled={pending()}
        validationState={error() ? 'invalid' : 'valid'}
        options={{
          'aria-label': t('formatting.jsonConfig'),
        }}
        slotClasses={{input: styles.input}}
      />
      <input
        hidden
        type="file"
        accept=".json,.prettierrc,application/json"
        aria-label={t('formatting.importJson')}
        ref={fileInput}
        onChange={event => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void readFile(file);
        }}
      />
      <div class={styles.actions}>
        <Button
          size="sm"
          theme="secondary"
          disabled={pending()}
          onClick={() => fileInput?.click()}
        >
          {t('formatting.importJson')}
        </Button>
        <Button
          size="sm"
          theme="primary"
          disabled={
            pending() || !!error() || value() === formattingJson.source()
          }
          onClick={() => void save()}
        >
          {t('formatting.applyJson')}
        </Button>
        <Button
          size="sm"
          theme="secondary"
          disabled={pending()}
          onClick={() => void clear()}
        >
          {t('formatting.clearJson')}
        </Button>
      </div>
      <Show when={message()}>
        {message => (
          <p class={styles.status} role="status">
            {message()}
          </p>
        )}
      </Show>
    </div>
  );
}
