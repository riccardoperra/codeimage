export const SSR_OPTIONS = {timeoutMs: 30_000, noScripts: true};

export const EXPORT_EXCLUDE_CSS =
  '[data-export-exclude="true"]{display:none!important}';

let queue: Promise<unknown> = Promise.resolve();

export function serialize<T>(pass: () => Promise<T>): Promise<T> {
  const result = queue.then(pass);
  queue = result.catch(() => undefined);
  return result;
}

export const page = (body: string) => `<html><body>${body}</body></html>`;
