import {createI18nContext, I18nContext, useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getRootEditorStore} from '@codeimage/store/editor';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {getUiStore} from '@codeimage/store/ui';
import {
  backgroundColorVar,
  CodeImageThemeProvider,
  SnackbarHost,
  ThemeProviderProps,
} from '@codeimage/ui';
import {darkGrayScale} from '@codeimage/ui/themes/darkTheme';
import '@codeimage/ui/themes/lightTheme';
import {OverlayProvider} from '@solid-aria/overlays';
import {Router, useRoutes} from '@solidjs/router';
import {snackbarHostAppStyleCss} from '@ui/snackbarHostAppStyle.css';
import {setElementVars} from '@vanilla-extract/dynamic';
import {Component, createEffect, lazy, on, Show, Suspense} from 'solid-js';
import {render} from 'solid-js/web';
import {StateProvider} from 'statebuilder';
import './assets/styles/app.scss';
import {SidebarPopoverHost} from './components/PropertyEditor/SidebarPopoverHost';
import {Scaffold} from './components/Scaffold/Scaffold';
import {locale} from './i18n';
import {EditorPageSkeleton} from './pages/Editor/components/EditorSkeleton';
import './theme/global.css';

const i18n = createI18nContext(locale);

if (import.meta.env.VITE_ENABLE_MSW === true) {
  import('./mocks/browser').then(({worker}) => worker.start());
}

function lazyWithNoLauncher(cp: () => Promise<{default: Component<any>}>) {
  return lazy(() => {
    queueMicrotask(() => {
      document.querySelector('#launcher')?.remove();
    });
    return cp();
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

const Editor = () => {
  const Page = lazyWithNoLauncher(() => import('./pages/Editor/Editor'));
  getThemeStore().loadThemes();
  return (
    <Suspense fallback={<EditorPageSkeleton />}>
      <Page />
    </Suspense>
  );
};

const NotFoundPage = lazyWithNoLauncher(
  () => import('./pages/NotFound/NotFoundPage'),
);

export function Bootstrap() {
  getRootEditorStore();
  const [, {locale}] = useI18n();
  const uiStore = getUiStore();
  const auth0 = getAuth0State();
  createEffect(on(() => uiStore.get.locale, locale));
  const mode = () => uiStore.currentTheme();

  const Routes = useRoutes([
    {
      path: '',
      component: () => {
        const state = getAuth0State();
        return (
          <Show fallback={<Editor />} when={state.loggedIn()}>
            <Dashboard />
          </Show>
        );
      },
    },
    {
      path: ':snippetId',
      component: Editor,
    },
    {
      path: '404',
      component: NotFoundPage,
    },
    {
      path: 'dashboard',
      data: ({navigate}) => navigate('/'),
      component: Dashboard,
    },
    {
      path: 'login',
      data: ({navigate}) => {
        if (auth0.loggedIn()) {
          navigate('/');
        } else {
          auth0.login();
        }
      },
    },
    {
      path: '/*all',
      data: ({navigate}) => navigate('/404'),
      component: NotFoundPage,
    },
  ]);

  createEffect(
    on(mode, theme => {
      const scheme = document.querySelector('meta[name="theme-color"]');
      if (scheme) {
        const color = theme === 'dark' ? darkGrayScale.gray1 : '#FFFFFF';
        scheme.setAttribute('content', color);
        setElementVars(document.body, {
          [backgroundColorVar]: color,
        });
      }
    }),
  );

  return (
    <Scaffold>
      <CodeImageThemeProvider tokens={tokens} theme={mode()}>
        <OverlayProvider>
          <SnackbarHost containerClassName={snackbarHostAppStyleCss} />
          <Router>
            <Suspense>
              <Routes />
            </Suspense>
          </Router>
        </OverlayProvider>
      </CodeImageThemeProvider>
      <SidebarPopoverHost />
    </Scaffold>
  );
}

getAuth0State()
  .initLogin()
  .then(() => {
    render(
      () => (
        <I18nContext.Provider value={i18n}>
          <StateProvider>
            <Bootstrap />
          </StateProvider>
        </I18nContext.Provider>
      ),
      document.getElementById('root') as HTMLElement,
    );
  });
