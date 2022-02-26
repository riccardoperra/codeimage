import {render} from 'solid-js/web';

import './index.css';
import App from './App';
import {staticConfiguration} from './core/configuration';
import {I18nProvider} from '@codeimage/locale';
import {locale} from './i18n';
import {StaticConfigurationProvider} from '@codeimage/config';

render(
  () => (
    <StaticConfigurationProvider config={staticConfiguration}>
      <I18nProvider dict={locale}>
        <App />
      </I18nProvider>
    </StaticConfigurationProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
