import {render} from 'solid-js/web';
import {I18nProvider} from '@codeimage/locale';
import {locale} from './i18n';
import './assets/styles/app.scss';
import {devTools} from '@ngneat/elf-devtools';
import {lazy, Suspense} from 'solid-js';
import App from './App';

if (import.meta.env.DEV) {
  devTools();
}

const AppComponent = lazy(async () => {
  await new Promise(r => setTimeout(r, 0));
  return {default: App};
});

export function Bootstrap() {
  return (
    <I18nProvider dict={locale}>
      <Suspense>
        <AppComponent />
      </Suspense>
    </I18nProvider>
  );
}

render(Bootstrap, document.getElementById('root') as HTMLElement);
