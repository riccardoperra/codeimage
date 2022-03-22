import {createEffect, createSignal, lazy, on} from 'solid-js';
import {useI18n} from '@codeimage/locale';
import {useModality} from './core/hooks/isMobile';
import {NotificationHandler} from './components/ui/Toast/SnackbarHost';
import {PortalHost} from './components/ui/PortalHost/PortalHost';
import {initEffects, registerEffects} from '@ngneat/effects';
import {onTabNameChange$, onThemeChange$} from '@codeimage/store/effect';
import {uiStore} from './state/ui';

initEffects();
registerEffects([onTabNameChange$, onThemeChange$]);

const ThemeSwitcher = lazy(() => {
  return import('./components/ThemeSwitcher/ThemeSwitcher').then(e => ({
    default: e.ThemeSwitcher,
  }));
});

const ReloadPrompt = lazy(() => {
  return import('./components/PromptUpdate/PromptUpdate');
});

const Content = lazy(() => {
  const modality = useModality();
  return modality === 'full' ? import('./Desktop') : import('./Mobile');
});

const App = () => {
  document.querySelector('#launcher')?.remove();
  const [, setPortalHostRef] = createSignal<HTMLElement>();
  const [, {locale}] = useI18n();

  createEffect(on(() => uiStore.locale, locale));

  return (
    <>
      <NotificationHandler />
      <ReloadPrompt />
      <PortalHost ref={setPortalHostRef} />
      <Content />
    </>
  );
};

export default App;
