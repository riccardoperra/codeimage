import {createI18nContext, I18nContext} from '@codeimage/locale';
import {CodeImageThemeProvider} from '@codeimage/ui';
import {enableElfProdMode} from '@ngneat/elf';
import {devTools} from '@ngneat/elf-devtools';
import {Router, useRoutes} from 'solid-app-router';
import {lazy, onMount, Suspense} from 'solid-js';
import {render} from 'solid-js/web';
import './assets/styles/app.scss';
import {enableUmami} from './core/constants/umami';
import {locale} from './i18n';

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
  const Routes = useRoutes([
    {path: '', component: lazy(() => import('./App'))},
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

  return (
    <Router>
      <I18nContext.Provider value={i18n}>
        <Suspense>
          <CodeImageThemeProvider theme={theme}>
            <Routes />
          </CodeImageThemeProvider>
        </Suspense>
      </I18nContext.Provider>
    </Router>
  );
}

render(() => <Bootstrap />, document.getElementById('root') as HTMLElement);
