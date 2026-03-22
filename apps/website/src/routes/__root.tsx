import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/solid-router';
import {TanStackRouterDevtools} from '@tanstack/solid-router-devtools';
import {Suspense} from 'solid-js';

import {HydrationScript} from 'solid-js/web';
import {UmamiScript} from '~/components/Umami/UmamiScript.tsx';

import {websiteThemeColor} from '~/core/constants';

import styleCss from '../styles.css?url';

export const Route = createRootRouteWithContext()({
  head: () => ({
    meta: [
      {charSet: 'utf-8'},
      {name: 'viewport', content: 'width=device-width, initial-scale=1'},
      {name: 'theme-color', content: websiteThemeColor},
    ],
    links: [
      {rel: 'stylesheet', href: styleCss},
      {rel: 'apple-touch-icon', href: '/apple-touch-icon.png'},
      {rel: 'manifest', href: '/manifest.webmanifest'},
      {rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg'},
      {rel: 'icon', href: '/favicon.ico'},
      {
        rel: 'preload',
        href: '/fonts/Mona-Sans-Bold.woff2',
        as: 'font',
        type: 'font/woff2',
      },
      {
        rel: 'preload',
        href: '/fonts/Mona-Sans-Medium.woff2',
        as: 'font',
        type: 'font/woff2',
      },
      {
        rel: 'preload',
        href: '/fonts/Mona-Sans-Regular.woff2',
        as: 'font',
        type: 'font/woff2',
      },
      {
        rel: 'preload',
        href: '/fonts/Mona-Sans-SemiBold.woff2',
        as: 'font',
        type: 'font/woff2',
      },
    ],
  }),
  shellComponent: RootComponent,
});

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <HydrationScript />
        <UmamiScript />
      </head>
      <body>
        <Suspense>
          <Outlet />
          <TanStackRouterDevtools />
        </Suspense>
        <Scripts />
      </body>
    </html>
  );
}
