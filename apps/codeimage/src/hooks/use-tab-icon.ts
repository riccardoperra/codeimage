import {LanguageIconDefinition, SUPPORTED_LANGUAGES} from '@codeimage/config';
import {Accessor, createEffect, createSignal, on} from 'solid-js';

export function createTabIcon(
  tabName: Accessor<string | null>,
  editorLanguageId: Accessor<string>,
  defaultIfEmpty: boolean,
) {
  const [icon, setIcon] = createSignal<LanguageIconDefinition | null>();
  const languages = SUPPORTED_LANGUAGES;

  const currentLanguage = () => {
    const id = editorLanguageId();
    return languages.find(language => language.id === id);
  };

  const languageIcons = () => {
    const language = currentLanguage();
    if (!language) {
      return [];
    }
    return language.icons;
  };

  const currentIcon = () => {
    const tab = tabName();
    if (!tab) {
      return null;
    }
    const matchedIcons = languageIcons().filter(icon => icon.matcher.test(tab));

    return (
      matchedIcons[matchedIcons.length - 1] ??
      (defaultIfEmpty ? languageIcons()[0] : null)
    );
  };

  createEffect(on(currentIcon, setIcon));

  return icon;
}

// export const useTabIcon = (options: UseTabIconOptions) => {
//   const [icon, setIcon] = createSignal<LanguageIconDefinition | null>();
//   const languages = SUPPORTED_LANGUAGES;
//
//   const currentLanguage = from(
//     editorLanguageId$.pipe(
//       select(languageId => {
//         return languages.find(({id}) => id === languageId);
//       }),
//     ),
//   );
//
//   const tabName = from(tabName$);
//
//   const languageIcons = createMemo(() => {
//     const language = currentLanguage();
//     if (!language) {
//       return [];
//     }
//     return language.icons;
//   });
//
//   const currentIcon = createMemo(() => {
//     const tab = tabName();
//
//     if (!tab) {
//       return null;
//     }
//     const matchedIcons = languageIcons().filter(icon => {
//       // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
//       return icon.matcher.test(tab);
//     });
//
//     return (
//       matchedIcons[matchedIcons.length - 1] ??
//       (options.withDefault ? languageIcons()[0] : null)
//     );
//   });
//
//   createEffect(on(currentIcon, setIcon));
//
//   return [icon];
// };
