// @refresh reload
import '@codeimage/ui/themes/darkTheme';
import {Suspense} from 'solid-js';
import {useAssets} from 'solid-js/web';
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
import {MainPageImagePreloading} from './components/Main/MainPage';
import './root.css';

function FontDefinitions() {
  return (
    <style>
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
    </style>
  );
}

export default function Root() {
  useAssets(() => (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="preload"
        href="/fonts/Mona-Sans-Bold.woff2"
        as="font"
        type="font/woff2"
        crossorigin=""
      />
      <link
        rel="preload"
        href="/fonts/Mona-Sans-Medium.woff2"
        as="font"
        type="font/woff2"
        crossorigin=""
      />
      <link
        rel="preload"
        href="/fonts/Mona-Sans-Regular.woff2"
        as="font"
        type="font/woff2"
        crossorigin=""
      />
      <link
        rel="preload"
        href="/fonts/Mona-Sans-SemiBold.woff2"
        as="font"
        type="font/woff2"
        crossorigin=""
      />
      <FontDefinitions />
      <MainPageImagePreloading />
    </>
  ));
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
