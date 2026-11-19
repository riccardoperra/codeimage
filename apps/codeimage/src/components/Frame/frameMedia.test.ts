import {createSignature} from '@codeimage/store/frame/model';
import {createRoot} from 'solid-js';
import {afterEach, expect, it, vi} from 'vitest';
import {createFrameMedia, resolveFrameMedia} from './frameMedia';

vi.mock('@codeimage/store/assets/assets', () => ({
  getAssetsStore: () => ({
    getAsset: (id: string) => () =>
      id === 'asset:avatar' ? {url: 'blob:avatar'} : undefined,
  }),
}));

afterEach(() => vi.restoreAllMocks());

const backgroundRequest = {
  backgroundImage: 'link:https://fixture.test/background.png',
  avatar: null,
  avatarAsset: null,
  tone: null,
} as const;

it.each(['fetch', 'body'] as const)(
  'rejects a background %s that exceeds its deadline with its URL and timeout',
  async stage => {
    const controller = new AbortController();
    const timeout = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(controller.signal);
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      if (stage === 'fetch') {
        return new Promise<Response>((_, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(controller.signal.reason),
          );
        });
      }
      return new Response(
        new ReadableStream({
          start(stream) {
            controller.signal.addEventListener('abort', () =>
              stream.error(controller.signal.reason),
            );
          },
        }),
      );
    });
    const result = resolveFrameMedia(backgroundRequest, vi.fn());
    const rejected = expect(result).rejects.toThrow(
      'Background image https://fixture.test/background.png timed out after 10000 ms',
    );
    await Promise.resolve();
    controller.abort(new DOMException('Deadline exceeded', 'TimeoutError'));
    await rejected;
    expect(timeout).toHaveBeenCalledWith(10000);
    expect(fetch).toHaveBeenCalledWith('https://fixture.test/background.png', {
      signal: controller.signal,
    });
  },
);

it('keeps background HTTP failures as hard errors', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(null, {status: 503}),
  );
  await expect(resolveFrameMedia(backgroundRequest, vi.fn())).rejects.toThrow(
    'Image https://fixture.test/background.png answered 503',
  );
});

it('hands the frame plain image URLs for a link background and an uploaded avatar', () => {
  createRoot(dispose => {
    const media = createFrameMedia(() => ({
      background: 'link:https://fixture.test/background.png',
      signature: {
        ...createSignature('me'),
        style: 'card',
        avatar: 'asset:avatar',
      },
    }));
    expect(media()).toEqual({
      backgroundImage: 'https://fixture.test/background.png',
      avatar: 'blob:avatar',
      tone: 'dark',
    });
    dispose();
  });
});
