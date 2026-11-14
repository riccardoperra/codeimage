import type {SnapshotInput} from './document';

// TODO(P3): import renderSnapshot from @codeimage/render and declare the
// workspace dependency once that package exists.
export async function renderSnapshot(
  snapshot: SnapshotInput,
): Promise<Uint8Array | string> {
  const rendererPackage = '@codeimage/render';
  const renderer = await import(rendererPackage);
  return renderer.renderSnapshot(snapshot);
}
