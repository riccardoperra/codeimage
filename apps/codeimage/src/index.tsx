import {createI18nContext, I18nContext, useI18n} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor';
import {uiStore} from '@codeimage/store/ui';
import {
  backgroundColorVar,
  CodeImageThemeProvider,
  LoadingOverlay,
} from '@codeimage/ui';
import {enableUmami} from '@core/constants/umami';
import {OverlayProvider} from '@solid-aria/overlays';
import {setElementVars} from '@vanilla-extract/dynamic';
import {Router, useRoutes} from 'solid-app-router';
import {createEffect, lazy, on, onMount, Suspense} from 'solid-js';
import {render} from 'solid-js/web';
import './assets/styles/app.scss';
import {SidebarPopoverHost} from './components/PropertyEditor/SidebarPopoverHost';
import {Scaffold} from './components/Scaffold/Scaffold';
import {locale} from './i18n';
import {darkGrayScale} from './theme/dark-theme.css';
import './theme/dark-theme.css';
import './theme/global.css';
import './theme/light-theme.css';

const i18n = createI18nContext(locale);

const theme: Parameters<typeof CodeImageThemeProvider>[0]['theme'] = {
  text: {
    weight: 'medium',
  },
};

const Dashboard = lazy(() =>
  import('./pages/Dashboard/Dashboard').then(component => {
    document.querySelector('#launcher')?.remove();
    return component;
  }),
);

export function Bootstrap() {
  getRootEditorStore();
  const [, {locale}] = useI18n();
  createEffect(on(() => uiStore.locale, locale));
  const mode = () => uiStore.themeMode;

  const Routes = useRoutes([
    {
      path: ':snippetId?',
      component: lazy(() => import('./pages/Editor/Editor')),
    },
    {
      path: 'dashboard',
      component: () => {
        return (
          <Suspense
            fallback={
              <div style={{position: 'fixed', height: '100%', width: '100%'}}>
                <LoadingOverlay overlay={true} size={'3x'} />
              </div>
            }
          >
            <Dashboard />
          </Suspense>
        );
      },
    },
  ]);

  onMount(() => {
    enableUmami();

    function trackView() {
      if (document.readyState === 'complete') {
        const currentUrl = `${location.pathname}${location.search}`;
        const currentReferrer = document.referrer ?? currentUrl;
        umami.trackView(currentUrl, currentReferrer);
      }
    }

    // TODO: auto-track must be fixed when app is multi-page
    document.addEventListener('readystatechange', trackView, true);
  });

  createEffect(
    on(mode, theme => {
      const scheme = document.querySelector('meta[name="theme-color"]');
      if (scheme) {
        const color = theme === 'dark' ? darkGrayScale.gray1 : '#FFFFFF';
        scheme.setAttribute('content', color);
        document.body.setAttribute('data-codeimage-theme', theme);
        setElementVars(document.body, {
          [backgroundColorVar]: color,
        });
      }
    }),
  );

  return (
    <Scaffold>
      <OverlayProvider>
        <Router>
          <CodeImageThemeProvider theme={theme}>
            <Suspense>
              <Routes />
            </Suspense>
          </CodeImageThemeProvider>
        </Router>
      </OverlayProvider>
      <SidebarPopoverHost />
    </Scaffold>
  );
}

render(
  () => (
    <I18nContext.Provider value={i18n}>
      <Bootstrap />
    </I18nContext.Provider>
  ),
  document.getElementById('root') as HTMLElement,
);
