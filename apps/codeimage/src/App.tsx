import {createEffect, createMemo, lazy, Match, on, Switch} from 'solid-js';
import {useUIState} from './state/ui';
import {useI18n} from '@codeimage/locale';
import {useModality} from './core/hooks/isMobile';
import {NotificationHandler} from './components/ui/Toast/SnackbarHost';
import ReloadPrompt from './components/PromptUpdate/PromptUpdate';

const LazyMobileApp = lazy(() => import('./_MobileApp'));
const LazyDesktopApp = lazy(() => import('./_DesktopApp'));

const Scaffold = lazy(() => import('./components/Scaffold/Scaffold'));

export default function App() {
  const ui = useUIState();
  const modality = useModality();
  const [, {locale}] = useI18n();
  const currentLocale = createMemo(() => ui.locale);

  createEffect(on(currentLocale, locale));

  return (
    <Scaffold>
      <NotificationHandler />
      <ReloadPrompt />
      <Switch>
        <Match when={modality === 'mobile'}>
          <LazyMobileApp />
        </Match>
        <Match when={modality === 'full'}>
          <LazyDesktopApp />
        </Match>
      </Switch>
    </Scaffold>
  );
}
