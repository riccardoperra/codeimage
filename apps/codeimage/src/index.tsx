import {render} from 'solid-js/web';
import {createI18nContext, I18nContext} from '@codeimage/locale';
import {locale} from './i18n';
import './assets/styles/app.scss';
import {lazy, Suspense} from 'solid-js';
import {Scaffold} from './components/Scaffold/Scaffold';

// if (import.meta.env.DEV) {
//   import('@ngneat/elf-devtools').then(({devTools}) => devTools());
// }

const App = lazy(async () => import('./App'));

const i18n = createI18nContext(locale);

export function Bootstrap() {
  return (
    <I18nContext.Provider value={i18n}>
      <Scaffold>
        <Suspense>
          <App />
        </Suspense>
      </Scaffold>
    </I18nContext.Provider>
  );
}

render(Bootstrap, document.getElementById('root') as HTMLElement);
