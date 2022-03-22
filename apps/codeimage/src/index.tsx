import {render} from 'solid-js/web';
import './assets/styles/app.scss';
import {lazy, Suspense} from 'solid-js';

if (import.meta.env.DEV) {
  import('@ngneat/elf-devtools').then(({devTools}) => devTools());
}

const App = lazy(async () => import('./App'));

export function Bootstrap() {
  return (
    <Suspense>
      <App />
    </Suspense>
  );
}

render(Bootstrap, document.getElementById('root') as HTMLElement);
