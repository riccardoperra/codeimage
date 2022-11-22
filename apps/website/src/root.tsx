// @refresh reload
import { Suspense } from 'solid-js';
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
  Style,
  Title,
} from 'solid-start';
import '@codeimage/ui/themes/darkTheme';
import './root.css';
import { MainPageImagePreloading } from './components/Main/MainPage';
import { useAssets } from 'solid-js/web';

function RootCriticalStyle() {
  return (
    <Style>
      {`
      @font-face {
        src: url('/fonts/Mona-Sans-Regular.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-Regular.woff2') format('woff2-variations');
        font-weight: 400;
        font-style: normal;
        font-stretch: 75% 125%;
        font-family: Mona Sans;
        font-display: swap;
      }
      @font-face {
        src: url('/fonts/Mona-Sans-Medium.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-Medium.woff2') format('woff2-variations');
        font-weight: 500;
        font-style: normal;
        font-stretch: 75% 125%;
        font-family: Mona Sans;
        font-display: swap;
      }
      @font-face {
        src: url('/fonts/Mona-Sans-SemiBold.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-SemiBold.woff2') format('woff2-variations');
        font-weight: 600;
        font-style: normal;
        font-stretch: 75% 125%;
        font-family: Mona Sans;
        font-display: swap;
      }
      @font-face {
        src: url('/fonts/Mona-Sans-Bold.woff2') format('woff2 supports variations'), url('/fonts/Mona-Sans-Bold.woff2') format('woff2-variations');
        font-weight: 700;
        font-style: normal;
        font-stretch: 75% 125%;
        font-family: Mona Sans;
        font-display: swap;
      }
    `}
    </Style>
  );
}

export default function Root() {
  useAssets(() => <style id="css-critical-style" />);

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
        <RootCriticalStyle />
        <MainPageImagePreloading />

        <Link
          rel="preload"
          href="/fonts/Mona-Sans-Bold.woff2"
          as="font"
          type="font/woff2"
          crossorigin=""
        />
        <Link
          rel="preload"
          href="/fonts/Mona-Sans-Medium.woff2"
          as="font"
          type="font/woff2"
          crossorigin=""
        />
        <Link
          rel="preload"
          href="/fonts/Mona-Sans-Regular.woff2"
          as="font"
          type="font/woff2"
          crossorigin=""
        />
        <Link
          rel="preload"
          href="/fonts/Mona-Sans-SemiBold.woff2"
          as="font"
          type="font/woff2"
          crossorigin=""
        />
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
