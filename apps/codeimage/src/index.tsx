import './assets/styles/app.scss';
import {createI18nContext, I18nContext, useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getUiStore} from '@codeimage/store/ui';
import type {ThemeProviderProps} from '@codeimage/ui';
import {backgroundColorVar, CodeImageThemeProvider} from '@codeimage/ui';
import '@codeimage/ui/themes/lightTheme';
import {Toaster} from '@codeui/kit/toast';
import {appEnvironment} from '@core/configuration';
import {createRouter, intentPreload, useNavigate} from '@solidjs/router';
import {render} from '@solidjs/web';
import {editorNotifications, notifications} from '@ui/notifications';
import * as notificationStyles from '@ui/notifications.css';
import {setElementVars} from '@vanilla-extract/dynamic';
import type {Component, ParentProps} from 'solid-js';
import {createEffect, lazy, Loading, onSettled, Show} from 'solid-js';
import {StoreProvider} from 'statebuilder';
import {Scaffold} from './components/Scaffold/Scaffold';
import type {AppLocaleEntries} from './i18n';
import {locale} from './i18n';
import './theme/global.css';

console.debug('💻 CodeImage version:', appEnvironment.version);

const mockApiReady =
  import.meta.env.VITE_ENABLE_MSW === true
    ? import('./mocks/browser').then(({startMockApi}) => startMockApi())
    : Promise.resolve();

function lazyWithNoLauncher(load: () => Promise<{default: Component}>) {
  return lazy(() => {
    queueMicrotask(() => {
      document.getElementById('launcher')?.remove();
    });
    return load();
  });
}

const tokens: ThemeProviderProps['tokens'] = {
  text: {
    weight: 'medium',
  },
};

const Dashboard = lazyWithNoLauncher(
  () => import('./pages/Dashboard/Dashboard'),
);
const UnifiedEditor = lazyWithNoLauncher(() => import('./pages/UnifiedEditor'));
const NotFoundPage = lazyWithNoLauncher(
  () => import('./pages/NotFound/NotFoundPage'),
);

function Home() {
  const auth = getAuth0State();
  return (
    <Show fallback={<UnifiedEditor />} when={auth.loggedIn()}>
      <Dashboard />
    </Show>
  );
}

function Login() {
  const auth = getAuth0State();
  const navigate = useNavigate();
  createEffect(auth.loggedIn, loggedIn => {
    if (loggedIn) {
      void navigate('/', {replace: true});
    } else {
      void auth.login();
    }
  });
  return null;
}

function DashboardRedirect() {
  const navigate = useNavigate();
  onSettled(() => {
    void navigate('/', {replace: true});
  });
  return null;
}

function NotFoundRedirect() {
  const navigate = useNavigate();
  onSettled(() => {
    void navigate('/404', {replace: true});
  });
  return null;
}

const Router = createRouter({
  routes: [
    {path: '/', component: Home},
    {path: '/:snippetId', component: UnifiedEditor},
    {path: '/404', component: NotFoundPage},
    {path: '/dashboard', component: DashboardRedirect},
    {path: '/login', component: Login},
    {path: '/*all', component: NotFoundRedirect},
  ],
  preloadLinks: intentPreload(),
});

export function Bootstrap(props: ParentProps) {
  const [t] = useI18n<AppLocaleEntries>();
  getRootEditorStore();
  const uiStore = getUiStore();
  const mode = () => uiStore.currentTheme();

  createEffect(mode, theme => {
    const scheme = document.head.querySelector('meta[name="theme-color"]');
    const color = theme === 'dark' ? '#151516' : '#FFFFFF';
    scheme?.setAttribute('content', color);
    setElementVars(document.documentElement, {[backgroundColorVar]: color});
  });

  return (
    <Scaffold>
      <CodeImageThemeProvider tokens={tokens} theme={mode()}>
        <Toaster
          toaster={notifications}
          position="top-center"
          closeLabel={t('common.closeNotification')}
          class={notificationStyles.top}
        />
        <Toaster
          toaster={editorNotifications}
          position="bottom-center"
          closeLabel={t('common.closeNotification')}
          class={notificationStyles.region}
        />
        <Loading>{props.children}</Loading>
      </CodeImageThemeProvider>
    </Scaffold>
  );
}

function LocalizedApp() {
  const uiStore = getUiStore();
  const i18n = createI18nContext(locale, {
    read: () => uiStore.get.locale,
    write: language => uiStore.setLocale(language),
  });

  return (
    <I18nContext value={i18n}>
      <Router>{props => <Bootstrap>{props.children}</Bootstrap>}</Router>
    </I18nContext>
  );
}

function App() {
  return (
    <StoreProvider>
      <LocalizedApp />
    </StoreProvider>
  );
}

getAuth0State()
  .initLogin()
  .catch(() => null)
  .then(async () => {
    await mockApiReady;
    const root = document.getElementById('root');
    if (root) render(() => <App />, root);
  });
