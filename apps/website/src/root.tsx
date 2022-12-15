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
import {ogImageUrl} from '~/core/constants';
import {breakpoints} from '~/theme/breakpoints';
import {rootTheme} from '~/theme/theme.css';
import {getUiStore} from '~/ui';
import './theme/root.css';

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

function MainPageImagePreloading() {
  return (
    <>
      <link
        rel="preload"
        href={'/landing/codeimage_preview_mobile.webp'}
        as="image"
        media={`(min-width: ${breakpoints.tablet}px) and (max-width: ${
          breakpoints.desktop - 1
        })`}
      />
      <link
        rel="preload"
        href={'/landing/codeimage_preview_desktop.webp'}
        as="image"
        media={`(min-width: ${breakpoints.desktop}px)`}
      />
    </>
  );
}

export default function Root() {
  const uiStore = getUiStore();
  useAssets(() => (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.webmanifest" />
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
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://codeimage.dev/" />
      <meta
        property="og:title"
        content="CodeImage - A tool to manage and beautify your code screenshots"
      />
      <meta
        property="og:description"
        content="CodeImage is the newest tool to help developers to manage their snippets and create beautiful screenshots of their source code"
      />
      <meta property="og:image" content={ogImageUrl} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://codeimage.dev/" />
      <meta
        property="twitter:title"
        content="CodeImage - A tool to manage and beautify your code screenshots"
      />
      <meta
        property="twitter:description"
        content="CodeImage is the newest tool to help developers to manage their snippets and create beautiful screenshots of their source code"
      />
    </>
  ));
  useAssets(() => <style id="css-critical-style" />);

  return (
    <Html lang="en" data-codeimage-theme="dark">
      <Head>
        <Title>
          CodeImage - A tool to manage and beautify your code screenshots
        </Title>
        <Meta charset="utf-8" />
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta name="title" content="CodeImage" />
        <Meta
          name="description"
          content="CodeImage is the newest tool to help developers to manage their snippets and create beautiful screenshots of their source code"
        />
        <Meta
          name="theme-color"
          content={uiStore.value.navColor ?? undefined}
        />
      </Head>
      <Body class={rootTheme}>
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
