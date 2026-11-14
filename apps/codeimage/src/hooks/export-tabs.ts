import {isIOS} from '@solid-primitives/platform';
import download from 'downloadjs';
import {zipSync} from 'fflate';
import {exportTabName} from './export-tab-name';
import {ExportMode} from './use-export-image';

export interface ExportTab {
  name: string | null;
}

export async function renderTabFiles<T extends ExportTab>(
  tabs: readonly T[],
  render: (tab: T) => Promise<Blob | string>,
): Promise<File[]> {
  const files: File[] = [];
  for (const [index, tab] of tabs.entries()) {
    const blob = await render(tab);
    if (!(blob instanceof Blob)) throw new Error('Expected an image blob.');
    // Name the file after the format the rasterizer produced, so a format it
    // cannot write as a blob never ships under the wrong extension.
    const extension = /^image\/(\w+)/.exec(blob.type)?.[1] ?? 'png';
    files.push(
      new File([blob], exportTabName(tab.name, index, extension), {
        type: blob.type,
      }),
    );
  }
  return files;
}

export async function deliverTabFiles(
  files: File[],
  mode: ExportMode,
): Promise<Blob> {
  if (
    mode === ExportMode.share &&
    navigator.canShare?.({files}) &&
    (await shareFiles(files))
  ) {
    return files[0];
  }
  const entries: Record<string, Uint8Array> = {};
  for (const file of files)
    entries[file.name] = new Uint8Array(await file.arrayBuffer());
  const archive = new Blob([new Uint8Array(zipSync(entries, {level: 0}))], {
    type: 'application/zip',
  });
  download(archive, 'codeimage-tabs.zip', archive.type);
  return archive;
}

// Rendering several tabs can outlast the click's user activation, so a
// NotAllowedError falls back to the zip. On iOS, "Save image" never settles
// the share promise (https://bugs.webkit.org/show_bug.cgi?id=231995).
function shareFiles(files: File[]): Promise<boolean> {
  const shared = navigator.share({files}).then(
    () => true,
    (error: unknown) => {
      const name = (error as {name?: string} | null)?.name;
      if (name === 'AbortError') return true;
      if (name === 'NotAllowedError') return false;
      throw error;
    },
  );
  if (!isIOS) return shared;
  return Promise.race([
    shared,
    new Promise<boolean>(resolve => setTimeout(() => resolve(true), 3000)),
  ]);
}
