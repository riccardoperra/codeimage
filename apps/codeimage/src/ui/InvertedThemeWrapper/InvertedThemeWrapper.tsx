import {uiStore} from '@codeimage/store/ui';
import {PropsWithChildren} from 'solid-js';
import {darkThemeCss} from '../../theme/dark-theme.css';
import {lightThemeCss} from '../../theme/light-theme.css';

export function InvertedThemeWrapper(props: PropsWithChildren) {
  const mode = uiStore.themeMode;
  const theme = () => (mode === 'light' ? darkThemeCss : lightThemeCss);
  return <div class={theme()}>{props.children}</div>;
}
