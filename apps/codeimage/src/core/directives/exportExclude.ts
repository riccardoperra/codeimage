export const EXPORT_EXCLUDE: unique symbol = Symbol('__export_exclude');

export function exportExclude(el: HTMLElement): void {
  Object.defineProperty(el, EXPORT_EXCLUDE, {
    value: true,
    configurable: false,
    enumerable: true,
  });
}

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface Directives {
      exportExclude?: true;
    }
  }
}
