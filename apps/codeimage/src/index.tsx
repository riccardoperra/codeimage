import {createI18nContext, I18nContext} from '@codeimage/locale';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {uiStore} from '@codeimage/store/ui';
import {backgroundColorVar, CodeImageThemeProvider} from '@codeimage/ui';
import {enableUmami} from '@core/constants/umami';
import {enableElfProdMode} from '@ngneat/elf';
import {devTools} from '@ngneat/elf-devtools';
import {setElementVars} from '@vanilla-extract/dynamic';
import {Router, useRoutes} from 'solid-app-router';
import {createEffect, lazy, on, onMount, Suspense} from 'solid-js';
import {render} from 'solid-js/web';
import './assets/styles/app.scss';
import {useServiceWorkerPrompt} from './hooks/use-sw-prompt';
import {locale} from './i18n';
import './theme/dark-theme.css';
import {darkGrayScale} from './theme/dark-theme.css';
import './theme/light-theme.css';

if (import.meta.env.DEV) {
  devTools();
}

if (import.meta.env.PROD) {
  enableElfProdMode();
}

const i18n = createI18nContext(locale);

const theme: Parameters<typeof CodeImageThemeProvider>[0]['theme'] = {
  text: {
    weight: 'medium',
  },
};

export function Bootstrap() {
  getRootEditorStore();
  onMount(() => useServiceWorkerPrompt());
  const mode = () => uiStore.themeMode;

  const Routes = useRoutes([
    {
      path: '',
      component: lazy(() => {
        setTimeout(() => getThemeStore().loadThemes());
        return import('./App').then(component => {
          document.querySelector('#launcher')?.remove();
          return component;
        });
      }),
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
    <Router>
      <I18nContext.Provider value={i18n}>
        <CodeImageThemeProvider theme={theme}>
          <Suspense>
            <Routes />
          </Suspense>
        </CodeImageThemeProvider>
      </I18nContext.Provider>
    </Router>
  );
}

render(() => <Bootstrap />, document.getElementById('root') as HTMLElement);
