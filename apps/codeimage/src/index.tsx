import {createI18nContext, I18nContext} from '@codeimage/locale';
import {CodeImageThemeProvider} from '@codeimage/ui';
import {enableElfProdMode} from '@ngneat/elf';
import {devTools} from '@ngneat/elf-devtools';
import {Router, Routes, useRoutes} from 'solid-app-router';
import {lazy, Suspense} from 'solid-js';
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

enableUmami();

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

render(Bootstrap, document.getElementById('root') as HTMLElement);
