import {uiStore} from '@codeimage/store/ui';
import {FlowProps} from 'solid-js';

export function InvertedThemeWrapper(props: FlowProps) {
  const mode = uiStore.themeMode;
  return (
    <div data-codeimage-theme={mode === 'light' ? 'dark' : 'light'}>
      {props.children}
    </div>
  );
}
