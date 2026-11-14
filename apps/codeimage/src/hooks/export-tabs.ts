import download from 'downloadjs';
import {zipSync} from 'fflate';
import {isIOS} from '@solid-primitives/platform';
import {exportTabName} from './export-tab-name';
import {ExportMode, type ExportImagePayload} from './use-export-image';

export async function exportTabs({
  payload,
  tabs,
  activeId,
  activate,
  render,
}: {
  payload: ExportImagePayload;
  tabs: {id: string; name: string | null}[];
  activeId: string;
  activate: (id: string) => void;
  render: (payload: ExportImagePayload) => Promise<Blob | string>;
}): Promise<Blob> {
  const files: File[] = [];
  try {
    for (const [index, tab] of tabs.entries()) {
      activate(tab.id);
      await new Promise<void>(resolve =>
        requestAnimationFrame(() => resolve()),
      );
      const blob = await render({
        ...payload,
        options: {...payload.options, mode: ExportMode.getBlob},
      });
      if (!(blob instanceof Blob)) throw new Error('Expected an image blob.');
      files.push(
        new File(
          [blob],
          exportTabName(tab.name, index, payload.options.extension),
          {type: blob.type},
        ),
      );
    }
  } finally {
    activate(activeId);
  }
  if (
    payload.options.mode === ExportMode.share &&
    navigator.canShare?.({files})
  ) {
    const share = navigator.share({files}).catch((error: unknown) => {
      if (!(error instanceof Error) || error.name !== 'AbortError') throw error;
    });
    if (isIOS)
      await Promise.race([
        share,
        new Promise(resolve => setTimeout(resolve, 3000)),
      ]);
    else await share;
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
