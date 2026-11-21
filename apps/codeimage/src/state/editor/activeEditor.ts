import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {editorNotifications} from '@ui/notifications';
import {appEnvironment} from '@core/configuration';
import {createEffect, createRoot} from 'solid-js';
import {createPrettierFormatter} from '../../hooks/createPrettierFormatter';
import type {AppLocaleEntries} from '../../i18n';

const $activeEditorState = () => {
  return createRoot(() => {
    const languages = SUPPORTED_LANGUAGES;
    const {
      state,
      isActive,
      actions: {updateEditor},
    } = getRootEditorStore();
    const currentEditor = () =>
      state.editors.find(editor => isActive(editor.id));

    const setLanguageId = (languageId: string) => {
      const current = currentEditor();
      const previousLanguage = current?.languageId;
      const language = languages.find(language => language.id === languageId);
      const defaultFormatter = formatter.availableFormatters()[0]?.parser;
      updateEditor(current?.id, draft => {
        draft.languageId = languageId;
        if (previousLanguage === languageId) return;
        if (
          language &&
          !language.icons.some(icon =>
            icon.matcher.test(draft.tab.tabName ?? ''),
          )
        ) {
          draft.tab.tabName = (draft.tab.tabName ?? 'index.tsx').replace(
            /\.[^.]*$/,
            language.icons[0].extension,
          );
        }
        draft.formatter = defaultFormatter ?? null;
      });
    };

    const setCode = (code: string) =>
      updateEditor(currentEditor()?.id, draft => {
        draft.code = code;
      });

    const setLineNumberStart = (lineNumberStart: number | null | undefined) => {
      updateEditor(currentEditor()?.id, draft => {
        draft.lineNumberStart = Math.min(
          Math.max(lineNumberStart || 1, appEnvironment.lineNumbers.min),
          appEnvironment.lineNumbers.max,
        );
      });
    };

    const setFormatterName = (formatter: string | null) =>
      updateEditor(currentEditor()?.id, draft => {
        draft.formatter = formatter;
      });

    const formatter = createPrettierFormatter(
      () => currentEditor()?.languageId ?? '',
      () => currentEditor()?.tab?.tabName ?? '',
      () => currentEditor()?.formatter ?? null,
    );

    createEffect(
      () => ({
        id: currentEditor()?.id,
        parser: formatter.availableFormatters()[0]?.parser ?? null,
      }),
      ({id, parser}) => {
        const tab = state.editors.find(editor => editor.id === id);
        if (tab && tab.formatter !== parser) {
          updateEditor(tab.id, draft => {
            draft.formatter = parser;
          });
        }
      },
    );

    return {
      editor: currentEditor,
      setLanguageId,
      setCode,
      setLineNumberStart,
      formatter,
      setFormatterName,
      canFormat: formatter.canFormat,
      format(code = currentEditor()?.code ?? '') {
        return new Promise(async r => {
          try {
            const result = await formatter.format(
              code,
              {
                singleAttributePerLine: true,
                trailingComma: 'none',
                arrowParens: 'always',
                bracketSpacing: true,
                proseWrap: 'always',
                printWidth: 90,
              },
              currentEditor()?.formatter ?? undefined,
            );

            if (result !== currentEditor()?.code) {
              setCode(result);
              editorNotifications.show({
                tone: 'success',
                description: () => {
                  const [t] = useI18n<AppLocaleEntries>();
                  return t('canvas.formattedCode');
                },
                duration: 2000,
              });
            }
            r(true);
          } catch (e) {
            console.warn(e);
            editorNotifications.show({
              tone: 'danger',
              description: () => {
                const [t] = useI18n<AppLocaleEntries>();
                return t('canvas.errorFormattedCode');
              },
            });
            r(false);
          }
        });
      },
    };
  });
};

let state: ReturnType<typeof $activeEditorState>;

export function getActiveEditorStore() {
  if (!state) {
    state = $activeEditorState();
  }
  return state;
}
