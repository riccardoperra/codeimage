import {getAssetsStore} from '@codeimage/store/assets/assets';
import {isAssetLinkUrl, isAssetUrl} from '@codeimage/store/assets/assetIds';
import type {AssetId, AssetLinkId} from '@codeimage/store/assets/assetIds';
import type {PersistedFrameState} from '@codeimage/store/frame/model';
import {
  avatarImageUrl,
  avatarKey,
  loadAvatar,
} from '@codeimage/store/frame/avatar';
import {avatarSource} from '@codeimage/store/frame/signature';
import type {AvatarSource} from '@codeimage/store/frame/signature';
import type {Accessor} from 'solid-js';
import {createMemo, createResource, untrack} from 'solid-js';
import {toneOfBackground} from './signatureColors';
import type {SignatureTone} from './signatureColors';
import {canvasSample, toneOfPixels} from './signatureTone';

export interface FrameMedia {
  readonly backgroundImage: string | null;
  readonly avatar: string | null;
  readonly tone: SignatureTone;
}

export interface FrameMediaRequest {
  readonly backgroundImage: AssetId | AssetLinkId | null;
  readonly avatar: AvatarSource | null;
  readonly avatarAsset: AssetId | null;
  readonly tone: SignatureTone | null;
}

export interface ImageBytes {
  readonly src: string;
  readonly data: ArrayBuffer;
}

export function frameMediaRequest(
  frame: Pick<PersistedFrameState, 'background' | 'signature'>,
): FrameMediaRequest {
  const signature = frame.signature?.style === 'card' ? frame.signature : null;
  return {
    backgroundImage: isAssetUrl(frame.background) ? frame.background : null,
    avatar: signature?.avatar === 'profile' ? avatarSource(signature) : null,
    avatarAsset:
      signature?.avatar && signature.avatar !== 'profile'
        ? signature.avatar
        : null,
    tone: isAssetUrl(frame.background)
      ? null
      : toneOfBackground(frame.background),
  };
}

export function createFrameMedia(
  frame: Accessor<Pick<PersistedFrameState, 'background' | 'signature'>>,
): Accessor<FrameMedia> {
  const assets = getAssetsStore();
  const request = createMemo(() => frameMediaRequest(frame()));
  const backgroundImage = () => {
    const id = request().backgroundImage;
    return id ? (assets.getAssetImageBrowserUrl(id)() ?? null) : null;
  };
  const key = () => {
    const source = request().avatar;
    return source ? avatarKey(source) : null;
  };
  const [avatar] = createResource(key, async key => {
    const source = untrack(() => request().avatar);
    return {key, url: source ? await loadAvatar(source) : null};
  });
  const [tone] = createResource(backgroundImage, async url => ({
    url,
    tone: toneOfPixels(await canvasSample(url).catch(() => null)) ?? 'dark',
  }));
  return () => {
    const asset = request().avatarAsset;
    const loaded = avatar.latest;
    const sampled = tone.latest;
    return {
      backgroundImage: backgroundImage(),
      avatar: asset
        ? (assets.getAssetImageBrowserUrl(asset)() ?? null)
        : loaded?.key === key()
          ? loaded.url
          : null,
      tone:
        request().tone ??
        (sampled?.url === backgroundImage() ? sampled.tone : 'dark'),
    };
  };
}

const AVATAR_TIMEOUT_MS = 3000;

async function fetchImage(
  src: string,
  signal?: AbortSignal,
): Promise<ImageBytes> {
  const response = await fetch(src, {signal});
  if (!response.ok) throw new Error(`Image ${src} answered ${response.status}`);
  if (signal && !response.headers.get('content-type')?.startsWith('image/'))
    throw new Error(`Image ${src} has no image content type`);
  return {src, data: await response.arrayBuffer()};
}

export async function resolveFrameMedia(
  request: FrameMediaRequest,
  sample: (image: ImageBytes) => Promise<Uint8Array>,
): Promise<{media: FrameMedia; images: ImageBytes[]}> {
  const [background, avatar] = await Promise.all([
    (async () => {
      const id = request.backgroundImage;
      if (!id) return null;
      if (!isAssetLinkUrl(id))
        throw new Error(
          `Frame background "${id}" is a browser asset; the snapshot does not carry its image`,
        );
      return fetchImage(id.slice('link:'.length));
    })(),
    (async () => {
      if (!request.avatar) return null;
      try {
        const signal = AbortSignal.timeout(AVATAR_TIMEOUT_MS);
        const url = await avatarImageUrl(request.avatar, signal);
        if (!url) return null;
        const image = await fetchImage(url, signal);
        // Decode optional media before the final render, so corrupt bytes also give initials.
        await sample(image);
        return image;
      } catch {
        return null;
      }
    })(),
  ]);
  const tone =
    request.tone ??
    (background
      ? toneOfPixels(await sample(background).catch(() => null))
      : null) ??
    'dark';
  return {
    media: {
      backgroundImage: background?.src ?? null,
      avatar: avatar?.src ?? null,
      tone,
    },
    images: [background, avatar].filter(
      (image): image is ImageBytes => image !== null,
    ),
  };
}
