import {render} from 'solid-js/web';

import './index.css';
import App from './App';
import {StaticConfigurationProvider} from './core/configuration/ConfigurationProvider';
import {staticConfiguration} from './core/configuration/static-configuration';
import {I18nProvider} from '@codeimage/locale';
import {locale} from './i18n';

render(
  () => (
    <StaticConfigurationProvider value={staticConfiguration}>
      <I18nProvider dict={locale}>
        <App />
      </I18nProvider>
    </StaticConfigurationProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
