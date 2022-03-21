import {render} from 'solid-js/web';
import {createI18nContext, I18nContext} from '@codeimage/locale';
import {locale} from './i18n';
import './assets/styles/app.scss';
import {devTools} from '@ngneat/elf-devtools';
import {Suspense} from 'solid-js';
import App from './App';

if (import.meta.env.DEV) {
  devTools();
}

const i18n = createI18nContext(locale);

export function Bootstrap() {
  return (
    <I18nContext.Provider value={i18n}>
      <App />
    </I18nContext.Provider>
  );
}

render(Bootstrap, document.getElementById('root') as HTMLElement);
