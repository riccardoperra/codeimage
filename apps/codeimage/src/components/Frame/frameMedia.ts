import type {ImageBytes} from '../../render/contract';
import {getAssetsStore} from '@codeimage/store/assets/assets';
import {
  assetLinkPrefix,
  isAssetLinkUrl,
  isAssetUrl,
} from '@codeimage/store/assets/assetIds';
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
  // A link is its own URL, as in Node; an upload is its object URL.
  const assetUrl = (id: AssetId | AssetLinkId | null) =>
    !id
      ? null
      : isAssetLinkUrl(id)
        ? id.slice(assetLinkPrefix.length)
        : (assets.getAsset(id)()?.url ?? null);
  const backgroundImage = createMemo(() => assetUrl(request().backgroundImage));
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
    // Reading the sample before it settles would suspend the frame.
    const sampled = tone.state === 'ready' ? tone() : undefined;
    return {
      backgroundImage: backgroundImage(),
      avatar: asset
        ? assetUrl(asset)
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
const BACKGROUND_TIMEOUT_MS = 10000;

async function fetchImage(
  src: string,
  signal?: AbortSignal,
): Promise<ImageBytes> {
  const response = await fetch(src, {signal});
  if (!response.ok) throw new Error(`Image ${src} answered ${response.status}`);
  return {src, data: await response.arrayBuffer()};
}

export async function resolveFrameMedia(
  request: FrameMediaRequest,
  sample: (image: ImageBytes) => Promise<Uint8Array>,
  offline = false,
): Promise<{media: FrameMedia; images: ImageBytes[]}> {
  const [background, avatar] = await Promise.all([
    (async () => {
      const id = request.backgroundImage;
      if (!id) return null;
      if (!isAssetLinkUrl(id))
        throw new Error(
          `Frame background "${id}" is a browser asset; the snapshot does not carry its image`,
        );
      if (offline)
        throw new Error('Remote background is unavailable with --offline');
      const url = id.slice(assetLinkPrefix.length);
      const signal = AbortSignal.timeout(BACKGROUND_TIMEOUT_MS);
      try {
        return await fetchImage(url, signal);
      } catch (cause) {
        if (signal.aborted) {
          throw new Error(
            `Background image ${url} timed out after ${BACKGROUND_TIMEOUT_MS} ms`,
            {cause},
          );
        }
        throw cause;
      }
    })(),
    (async () => {
      if (!request.avatar || offline) return null;
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
