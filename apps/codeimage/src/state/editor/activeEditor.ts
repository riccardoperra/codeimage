import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getInvertedThemeMode} from '@codeimage/store/ui';
import {toast} from '@codeimage/ui';
import {createRoot} from 'solid-js';
import {createPrettierParser} from '../../hooks/createPrettierParser';
import {AppLocaleEntries} from '../../i18n';

const $activeEditorState = createRoot(() => {
  const {
    state,
    isActive,
    actions: {setEditors},
  } = getRootEditorStore();
  const currentEditor = () => state.editors.find(editor => isActive(editor.id));

  const currentEditorIndex = () =>
    state.editors.findIndex(editor => editor.id === currentEditor()?.id);

  const setLanguageId = (languageId: string) =>
    setEditors(currentEditorIndex(), 'languageId', languageId);

  const setCode = (code: string) =>
    setEditors(currentEditorIndex(), 'code', code);

  return {
    editor: currentEditor,
    setLanguageId,
    setCode,
    format(code = currentEditor()?.code ?? '') {
      return new Promise(async r => {
        const parser = createPrettierParser(
          () => currentEditor()?.languageId ?? '',
          () => currentEditor()?.tab?.tabName ?? '',
        );

        try {
          const result = await parser.parse(code, {
            singleAttributePerLine: true,
            trailingComma: 'none',
            arrowParens: 'always',
            bracketSpacing: true,
            proseWrap: 'always',
            printWidth: 90,
          });

          if (result !== currentEditor()?.code) {
            setCode(result);
            toast.success(
              () => {
                const [t] = useI18n<AppLocaleEntries>();
                return t('canvas.formattedCode');
              },
              {
                position: 'bottom-center',
                theme: getInvertedThemeMode(),
              },
            );
          }
          r(true);
        } catch (e) {
          toast.error(
            () => {
              const [t] = useI18n<AppLocaleEntries>();
              return t('canvas.errorFormattedCode');
            },
            {
              position: 'bottom-center',
              theme: getInvertedThemeMode(),
            },
          );
          r(false);
        }
      });
    },
  };
});

export function getActiveEditorStore() {
  return $activeEditorState;
}
