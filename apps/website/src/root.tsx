// @refresh reload
import {onMount, Suspense} from 'solid-js';
import {
  Body,
  ErrorBoundary,
  FileRoutes,
  Head,
  Html,
  Link,
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
        <Meta name="title" content="CodeImage" />
        <Meta
          name="description"
          content="CodeImage is the next-gen tool to help developers to create and share beautiful screenshots of their source code"
        />
        <Link rel="preconnect" href="https://fonts.googleapis.com" />
        <Link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <Link
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
