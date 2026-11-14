import type {buildSnapshot} from './snapshot';

export async function renderSnapshot(
  document: Awaited<ReturnType<typeof buildSnapshot>>,
): Promise<Uint8Array | string> {
  const rendererPackage = '@codeimage/render';
  const renderer = await import(rendererPackage);
  return renderer.renderSnapshot(document);
}
