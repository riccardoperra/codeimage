import {render} from 'solid-js/web';

import './index.scss';
import App from './App';
import {StaticConfigurationProvider} from './core/configuration/ConfigurationProvider';
import {staticConfiguration} from './core/configuration/static-configuration';

render(
  () => (
    <StaticConfigurationProvider value={staticConfiguration}>
      <App />
    </StaticConfigurationProvider>
  ),
  document.getElementById('root') as HTMLElement,
);
