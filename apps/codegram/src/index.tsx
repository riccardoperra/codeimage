import {render} from 'solid-js/web';

import './index.css';
import App from './App';
import {StaticConfigurationProvider} from './core/configuration/ConfigurationProvider';
import {staticConfiguration} from './core/configuration/static-configuration';
import {I18nProvider} from '@codegram/locale';

render(
  () => (
    <StaticConfigurationProvider value={staticConfiguration}>
      <I18nProvider>
        <App />
      </I18nProvider>
    </StaticConfigurationProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
