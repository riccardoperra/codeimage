import {uiStore} from '@codeimage/store/ui';
import {ParentProps} from 'solid-js';

export function InvertedThemeWrapper(props: ParentProps) {
  const mode = uiStore.themeMode;
  return (
    <div data-codeimage-theme={mode === 'light' ? 'dark' : 'light'}>
      {props.children}
    </div>
  );
}
