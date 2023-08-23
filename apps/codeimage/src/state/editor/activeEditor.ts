import {SUPPORTED_LANGUAGES} from '@codeimage/config';
import {useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getUiStore} from '@codeimage/store/ui';
import {toast} from '@codeimage/ui';
import {isNonNullable} from '@solid-primitives/utils';
import {createEffect, createMemo, createRoot, on} from 'solid-js';
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
        const defaultFormatter = formatter.availableFormatters()[0].parser;
        setEditors(currentEditorIndex(), 'formatter', defaultFormatter ?? null);
      }
    };

    const setCode = (code: string) =>
      setEditors(currentEditorIndex(), 'code', code);

    const setFormatterName = (formatter: string | null) =>
      setEditors(currentEditorIndex(), 'formatter', formatter);

    const formatter = createPrettierFormatter(
      () => currentEditor()?.languageId ?? '',
      () => currentEditor()?.tab?.tabName ?? '',
      () => currentEditor()?.formatter ?? null,
    );

    // On each tab editor change, it will listen for name and languageId updates
    // in order to update the formatter with the default one.
    let unsubscribe: (() => void) | undefined = undefined;
    createEffect(() => {
      const editor = currentEditorIndex();
      if (!!unsubscribe) unsubscribe();
      if (!isNonNullable(editor)) return;
      createRoot(dispose => {
        unsubscribe = dispose;
        const name = createMemo(() => currentEditor()?.tab?.tabName);
        const languageId = createMemo(() => currentEditor()?.languageId);
        createEffect(
          on([name, languageId], () => {
            const defaultFormatter = formatter.availableFormatters()[0];
            setEditors(
              currentEditorIndex(),
              'formatter',
              defaultFormatter?.parser ?? null,
            );
          }),
        );
      });
    });

    return {
      editor: currentEditor,
      setLanguageId,
      setCode,
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
