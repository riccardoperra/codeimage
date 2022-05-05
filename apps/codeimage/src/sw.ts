import {clientsClaim} from 'workbox-core';
import {cleanupOutdatedCaches, precacheAndRoute} from 'workbox-precaching';
import {registerRoute} from 'workbox-routing';
import {StaleWhileRevalidate} from 'workbox-strategies';

declare let self: ServiceWorkerGlobalScope;

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);
// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.

// clean old assets
cleanupOutdatedCaches();

// to allow work offline
// registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

registerRoute(({url}) => url.origin === '/assets/', new StaleWhileRevalidate());

registerRoute(
  new RegExp('/*.(eot|svg|cur|jpg|png|webp|gif|otf|ttf|woff|woff2)'),
  new StaleWhileRevalidate(),
);

self.skipWaiting();
clientsClaim();
