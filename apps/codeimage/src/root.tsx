// @refresh reload
import {enableElfProdMode} from '@ngneat/elf';
import {devTools} from '@ngneat/elf-devtools';
import {Suspense} from 'solid-js';
import {ErrorBoundary} from 'solid-start/error-boundary';
import {Routes} from 'solid-start/root';

if (import.meta.env.DEV) {
  devTools();
}

if (import.meta.env.PROD) {
  enableElfProdMode();
}

export default function Root() {
  return (
    <>
      <ErrorBoundary>
        <Suspense>
          <Routes />
        </Suspense>
      </ErrorBoundary>
    </>
  );
}
