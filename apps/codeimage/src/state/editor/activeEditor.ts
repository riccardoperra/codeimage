import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getUiStore} from '@codeimage/store/ui';
import {toast} from '@codeimage/ui';
import {createRoot} from 'solid-js';
import {createPrettierFormatter} from '../../hooks/createPrettierFormatter';
import {AppLocaleEntries} from '../../i18n';

const $activeEditorState = () => {
  return createRoot(() => {
    const languages = SUPPORTED_LANGUAGES;
    const {
      state,
      isActive,
      actions: {setEditors},
    } = getRootEditorStore();
    const currentEditor = () =>
      state.editors.find(editor => isActive(editor.id));

    const currentEditorIndex = () =>
      state.editors.findIndex(editor => editor.id === currentEditor()?.id);

    const setLanguageId = (languageId: string) => {
      const currentLanguageId = currentEditor()?.languageId;
      setEditors(currentEditorIndex(), 'languageId', languageId);
      if (currentLanguageId !== languageId) {
        const language = languages.find(language => language.id === languageId);
        if (language) {
          const tabName = currentEditor()?.tab?.tabName;
          if (!language.icons.find(item => item.matcher.test(tabName ?? ''))) {
            setEditors(currentEditorIndex(), 'tab', 'tabName', name =>
              (name ?? 'index.tsx').replace(
                /\.[^.]*$/,
                language.icons[0].extension,
              ),
            );
          }
        }
      }
    };

    const setCode = (code: string) =>
      setEditors(currentEditorIndex(), 'code', code);

    const formatter = createPrettierFormatter(
      () => currentEditor()?.languageId ?? '',
      () => currentEditor()?.tab?.tabName ?? '',
    );

    return {
      editor: currentEditor,
      setLanguageId,
      setCode,
      canFormat: formatter.canFormat,
      format(code = currentEditor()?.code ?? '') {
        return new Promise(async r => {
          try {
            const result = await formatter.format(code, {
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
                  theme: getUiStore().invertedThemeMode(),
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
                theme: getUiStore().invertedThemeMode(),
              },
            );
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
