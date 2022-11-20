// @refresh reload
import {onMount, Suspense} from 'solid-js';
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Meta,
  Routes,
  Scripts,
  Title,
} from 'solid-start';
import './root.css';
import '@codeimage/ui/themes/darkTheme';
import {MainPageImagePreloading} from './components/Main/MainPage';

export default function Root() {
  return (
    <Html lang="en" data-codeimage-theme="dark">
      <Head>
        <Title>CodeImage</Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
          rel="stylesheet"
          media="print"
          data-defer-font="codemirror"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap"
        />
        <MainPageImagePreloading />
      </Head>
      <Body>
        <Suspense>
          <ErrorBoundary>
            <Routes>
              <FileRoutes />
            </Routes>
          </ErrorBoundary>
        </Suspense>
        <Scripts />
      </Body>
    </Html>
  );
}
