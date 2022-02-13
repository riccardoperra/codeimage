import {render} from 'solid-js/web';

import './index.scss';
import App from './App';
import {devTools} from '@ngneat/elf-devtools';

devTools();

render(() => <App />, document.getElementById('root') as HTMLElement);
