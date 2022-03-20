import {render} from 'solid-js/web';

import App from './App';
import {I18nProvider} from '@codeimage/locale';
import {locale} from './i18n';
import './assets/styles/app.scss';
import {devTools} from '@ngneat/elf-devtools';

if (import.meta.env.DEV) {
  devTools();
}

setTimeout(() => {
  render(Bootstrap, document.getElementById('root') as HTMLElement);
});

export function Bootstrap() {
  return (
    <I18nProvider dict={locale}>
      <App />
    </I18nProvider>
  );
}
