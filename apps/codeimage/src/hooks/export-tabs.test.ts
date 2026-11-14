import {afterEach, expect, test, vi} from 'vitest';
import download from 'downloadjs';
import {deliverTabFiles} from './export-tabs';
import {ExportMode} from './use-export-image';

vi.mock('downloadjs', () => ({default: vi.fn()}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

const files = [new File(['image'], 'snippet.png', {type: 'image/png'})];

test('a completed share returns the image without downloading a zip', async () => {
  vi.stubGlobal('navigator', {
    canShare: () => true,
    share: async () => undefined,
  });
  expect(await deliverTabFiles(files, ExportMode.share)).toBe(files[0]);
  expect(download).not.toHaveBeenCalled();
});

test('canceling a share does not report success or download a zip', async () => {
  vi.stubGlobal('navigator', {
    canShare: () => true,
    share: async () => {
      throw new DOMException('Canceled', 'AbortError');
    },
  });
  expect(await deliverTabFiles(files, ExportMode.share)).toBeUndefined();
  expect(download).not.toHaveBeenCalled();
});

test('a denied share still downloads a zip', async () => {
  vi.stubGlobal('navigator', {
    canShare: () => true,
    share: async () => {
      throw new DOMException('Denied', 'NotAllowedError');
    },
  });
  const result = await deliverTabFiles(files, ExportMode.share);
  expect(result?.type).toBe('application/zip');
  expect(download).toHaveBeenCalledWith(
    result,
    'codeimage-tabs.zip',
    'application/zip',
  );
});
