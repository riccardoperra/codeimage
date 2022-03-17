import {useStaticConfiguration} from '../core/configuration';
import {useEditorState} from '../state/editor';
import {useTerminalState} from '../state/terminal';
import {createEffect, createMemo, createSignal, on} from 'solid-js';

interface UseTabIconOptions {
  withDefault: boolean;
}

export const useTabIcon = (options: UseTabIconOptions) => {
  // TODO: add typings
  const [icon, setIcon] = createSignal<unknown>();
  const configuration = useStaticConfiguration();
  // ATTENTION: Cannot use selector due to store structure!!!
  const editorState = useEditorState();
  const terminalState = useTerminalState();

  const languageIcons = createMemo(() => {
    const lngConfig = configuration.languages.find(
      ({id}) => id === editorState.languageId,
    );
    if (!lngConfig) {
      return [];
    }
    return lngConfig.icons;
  });

  const currentIcon = createMemo(() => {
    if (!terminalState.tabName) {
      return null;
    }
    const matchedIcons = languageIcons().filter(icon => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return icon.matcher.test(terminalState.tabName!);
    });

    return (
      matchedIcons[matchedIcons.length - 1] ??
      (options.withDefault ? languageIcons()[0] : null)
    );
  });

  createEffect(on(currentIcon, setIcon));

  return [icon];
};
