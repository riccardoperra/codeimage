import {LanguageIconDefinition, SUPPORTED_LANGUAGES} from '@codeimage/config';
import {select} from '@ngneat/elf';
import {createEffect, createMemo, createSignal, from, on} from 'solid-js';
import {editorLanguageId$} from '../state/editor';
import {tabName$} from '../state/terminal';

interface UseTabIconOptions {
  withDefault: boolean;
}

export const useTabIcon = (options: UseTabIconOptions) => {
  const [icon, setIcon] = createSignal<LanguageIconDefinition | null>();
  const languages = SUPPORTED_LANGUAGES;

  const currentLanguage = from(
    editorLanguageId$.pipe(
      select(languageId => {
        return languages.find(({id}) => id === languageId);
      }),
    ),
  );

  const tabName = from(tabName$);

  const languageIcons = createMemo(() => {
    const language = currentLanguage();
    if (!language) {
      return [];
    }
    return language.icons;
  });

  const currentIcon = createMemo(() => {
    const tab = tabName();

    if (!tab) {
      return null;
    }
    const matchedIcons = languageIcons().filter(icon => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return icon.matcher.test(tab);
    });

    return (
      matchedIcons[matchedIcons.length - 1] ??
      (options.withDefault ? languageIcons()[0] : null)
    );
  });

  createEffect(on(currentIcon, setIcon));

  return [icon];
};
