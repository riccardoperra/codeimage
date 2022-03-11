import {
  createEffect,
  createMemo,
  lazy,
  Match,
  on,
  Suspense,
  Switch,
} from 'solid-js';
import {useUIState} from './state/ui';
import {useI18n} from '@codeimage/locale';
import {useModality} from './core/hooks/isMobile';
import {NotificationHandler} from './components/ui/Toast/SnackbarHost';
import ReloadPrompt from './components/PromptUpdate/PromptUpdate';
import {LoadingOverlay} from './components/LoadingOverlay/LoadingOverlay';

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
      <Suspense
        fallback={<LoadingOverlay overlay={true} width={128} height={128} />}
      >
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
      </Suspense>
    </Scaffold>
  );
}
