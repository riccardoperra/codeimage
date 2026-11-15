import {createSignature} from '@codeimage/store/frame/model';
import type * as solid from 'solid-js';
import {createRoot} from 'solid-js';
import {expect, it, vi} from 'vitest';
import {createFrameMedia} from './frameMedia';

vi.mock('solid-js', () =>
  vi.importActual<typeof solid>('solid-js/dist/solid.js'),
);
vi.mock('@codeimage/store/assets/assets', () => ({
  getAssetsStore: () => ({
    getAsset: (id: string) => () =>
      id === 'asset:avatar' ? {url: 'blob:avatar'} : undefined,
  }),
}));

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
