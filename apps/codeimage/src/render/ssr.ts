import type {JSX} from '@solidjs/web';
import {renderToStream} from '@solidjs/web';

export async function renderSettled(render: () => JSX.Element) {
  return await renderToStream(render, {
    signal: AbortSignal.timeout(30_000),
    noScripts: true,
  });
}

export const EXPORT_EXCLUDE_CSS =
  '[data-export-exclude="true"]{display:none!important}';

export const page = (body: string) => `<html><body>${body}</body></html>`;
