import {createEffect, on} from 'solid-js';

export const EXPORT_EXCLUDE: unique symbol = Symbol('__export_exclude');

export function exportExclude(
  el: HTMLElement & {[EXPORT_EXCLUDE]?: boolean},
  exclude: () => boolean,
): void {
  Object.defineProperty(el, EXPORT_EXCLUDE, {
    value: true,
    configurable: true,
    enumerable: true,
    writable: true,
  });

  el.setAttribute('data-export-exclude', exclude() ? 'true' : 'false');

  createEffect(
    on(exclude, exclude => {
      if (el.hasOwnProperty(EXPORT_EXCLUDE) && el[EXPORT_EXCLUDE] !== exclude) {
        el[EXPORT_EXCLUDE] = exclude;
        el.setAttribute('data-export-exclude', exclude ? 'true' : 'false');
      }
    }),
  );
}

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      exportExclude?: boolean;
    }
  }
}
