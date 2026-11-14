import {useI18n} from '@codeimage/locale';
import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import {getFrameState} from '@codeimage/store/editor/frame';
import type {
  FrameSignature,
  SignatureAvatar,
  SignaturePlatform,
  SignaturePosition,
} from '@codeimage/store/frame/model';
import {createSignature} from '@codeimage/store/frame/model';
import {
  avatarSource,
  parseProfile,
  PROFILE_PREFIX,
  readProfile,
  writeProfile,
} from '@codeimage/store/frame/signature';
import {TextField} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import type {JSX} from 'solid-js';
import {createSignal, Show} from 'solid-js';
import {PlatformIcon} from '../../../components/Frame/FrameSignature';
import type {AppLocaleEntries} from '../../../i18n';
import type {SegmentedControl} from '../model';
import * as controls from './controls.css';
import type {FieldSize} from './fields';
import * as styles from './signature.css';

export const PLATFORM_NAMES: Record<SignaturePlatform, string> = {
  x: 'X',
  bluesky: 'Bluesky',
  github: 'GitHub',
  mastodon: 'Mastodon',
  linkedin: 'LinkedIn',
};

// Clearing the handle hides the signature; typing again brings back the
// style, icon, name and avatar it had, for the rest of the session.
const [remembered, setRemembered] = createSignal<FrameSignature | null>(null);

export function SignatureHandleField(props: {id?: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const frame = getFrameState();
  const [announcement, setAnnouncement] = createSignal('');

  const write = (handle: string, platform?: SignaturePlatform) => {
    const current = frame.store.signature;
    if (!handle.trim()) {
      if (current) setRemembered(current);
      frame.setSignature(null);
      return;
    }
    const base = current ?? remembered() ?? createSignature(handle);
    frame.setSignature({
      ...base,
      handle,
      platform: platform ?? base.platform,
    });
  };

  // A pasted profile link becomes its handle and platform. Typing is never
  // rewritten, since a half-typed link would match too early.
  const onPaste = (event: ClipboardEvent) => {
    const profile = parseProfile(event.clipboardData?.getData('text') ?? '');
    if (!profile) return;
    event.preventDefault();
    write(profile.handle, profile.platform);
    setAnnouncement(
      t('signature.detected', {platform: PLATFORM_NAMES[profile.platform]}),
    );
  };

  return (
    <div class={styles.field} onPaste={onPaste}>
      <TextField
        id={props.id}
        size="sm"
        placeholder={t('signature.handlePlaceholder')}
        value={frame.store.signature?.handle ?? ''}
        onChange={value => write(value)}
      />
      <span class={controls.visuallyHidden} aria-live="polite">
        {announcement()}
      </span>
    </div>
  );
}

export function SignatureNameField(props: {id?: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const frame = getFrameState();
  return (
    <TextField
      id={props.id}
      size="sm"
      placeholder={t('signature.namePlaceholder')}
      value={frame.store.signature?.name ?? ''}
      onChange={name => {
        const current = frame.store.signature;
        if (current) frame.setSignature({...current, name: name || null});
      }}
    />
  );
}

/** A square, at most 256px, so the frame and the saved asset stay light. */
async function squareAvatar(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const size = Math.min(256, side);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas
    .getContext('2d')
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      size,
      size,
    );
  bitmap.close();
  // Browsers that cannot write WebP fall back to PNG, which the type reports.
  const blob = await new Promise<Blob | null>(resolve =>
    canvas.toBlob(resolve, 'image/webp', 0.9),
  );
  if (!blob) return file;
  return new File([blob], 'avatar', {type: blob.type});
}

type AvatarChoice = 'initials' | 'profile' | 'upload';

export function SignatureAvatarField(props: {id?: string; size?: FieldSize}) {
  const [t] = useI18n<AppLocaleEntries>();
  const frame = getFrameState();
  const assets = getAssetsStore();
  const [uploaded, setUploaded] = createSignal<SignatureAvatar | null>(null);
  let input!: HTMLInputElement;

  const avatar = () => frame.store.signature?.avatar ?? null;
  const asset = (): SignatureAvatar | null => {
    const value = avatar();
    return value && isAssetUrl(value) ? value : null;
  };
  const choice = (): AvatarChoice =>
    avatar() === 'profile' ? 'profile' : asset() ? 'upload' : 'initials';
  const setAvatar = (value: FrameSignature['avatar']) => {
    const current = frame.store.signature;
    if (current) frame.setSignature({...current, avatar: value});
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const stored = await assets.addFile(await squareAvatar(file), 'signature');
    const id = stored.id as SignatureAvatar;
    setUploaded(id);
    setAvatar(id);
  };

  return (
    <div class={styles.avatarRow}>
      <div
        class={`${controls.segmented} ${styles.avatarChoice}`}
        data-size={props.size ?? 'sm'}
      >
        <SegmentedField<AvatarChoice>
          adapt
          id={props.id}
          size={props.size ?? 'sm'}
          value={choice()}
          onChange={next => {
            if (next === 'initials') return setAvatar(null);
            if (next === 'profile') return setAvatar('profile');
            const previous = uploaded() ?? asset();
            if (previous && assets.getAsset(previous)()) setAvatar(previous);
            else input.click();
          }}
          items={[
            {label: t('signature.initials'), value: 'initials'},
            {label: t('signature.profileAvatar'), value: 'profile'},
            {label: t('signature.upload'), value: 'upload'},
          ]}
        />
      </div>
      <Show when={asset() && assets.getAsset(asset()!)()}>
        {stored => (
          <button
            type="button"
            class={styles.avatarThumb}
            title={t('signature.replace')}
            aria-label={t('signature.replace')}
            onClick={() => input.click()}
          >
            <img class={styles.avatarImage} src={stored().url} alt="" />
          </button>
        )}
      </Show>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        hidden
        onChange={event => {
          void onFile(event.currentTarget.files?.[0]);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}

/**
 * Where the profile avatar comes from, for a handle that is not the right
 * account. The prefix shows the platform; a pasted link names its own.
 */
export function SignatureProfileField(props: {id?: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const frame = getFrameState();
  const signature = () => frame.store.signature;
  const stored = () => readProfile(signature()?.profile ?? null);
  const platform = (): SignaturePlatform =>
    stored()?.platform ?? signature()?.platform ?? 'github';
  const unavailable = () => {
    const current = signature();
    return !!current && !avatarSource(current);
  };
  const hintId = () => `${props.id ?? 'signature-profile'}-hint`;

  const write = (value: string) => {
    const current = signature();
    if (!current) return;
    frame.setSignature({...current, profile: writeProfile(value, platform())});
  };

  return (
    <div class={styles.profile}>
      <div class={styles.prefixed}>
        <span class={styles.prefix} aria-hidden="true">
          {PROFILE_PREFIX[platform()]}
        </span>
        <TextField
          id={props.id}
          size="sm"
          aria-describedby={hintId()}
          placeholder={t('signature.profilePlaceholder')}
          value={stored()?.account ?? ''}
          onChange={write}
          slotClasses={{root: styles.prefixedRoot, input: styles.prefixedInput}}
        />
      </div>
      <span
        id={hintId()}
        class={styles.hint}
        data-tone={unavailable() ? 'warning' : undefined}
      >
        {unavailable()
          ? t('signature.noPublicAvatar', {
              platform: PLATFORM_NAMES[platform()],
            })
          : t('signature.profileHint')}
      </span>
    </div>
  );
}

// Functions, since a Solid element is one DOM node and each option needs its own.
const STYLE_GLYPHS: Record<FrameSignature['style'], () => JSX.Element> = {
  minimal: () => (
    <svg class={styles.glyph} width={22} height={17} viewBox="0 0 18 14">
      <rect
        x="2"
        y="8.5"
        width="14"
        height="2.5"
        rx="1.25"
        fill="currentColor"
      />
    </svg>
  ),
  pill: () => (
    <svg
      class={styles.glyph}
      width={22}
      height={17}
      viewBox="0 0 18 14"
      fill="none"
    >
      <rect
        x="1"
        y="3.5"
        width="16"
        height="8"
        rx="4"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <rect
        x="5"
        y="6.75"
        width="8"
        height="1.5"
        rx="0.75"
        fill="currentColor"
      />
    </svg>
  ),
  card: () => (
    <svg
      class={styles.glyph}
      width={22}
      height={17}
      viewBox="0 0 18 14"
      fill="none"
    >
      <rect
        x="0.75"
        y="1.75"
        width="16.5"
        height="10.5"
        rx="3"
        stroke="currentColor"
        stroke-width="1.5"
      />
      <circle cx="5.5" cy="7" r="2" fill="currentColor" />
      <rect
        x="9"
        y="5.25"
        width="5.5"
        height="1.5"
        rx="0.75"
        fill="currentColor"
      />
      <rect
        x="9"
        y="7.75"
        width="3.5"
        height="1.5"
        rx="0.75"
        fill="currentColor"
        opacity="0.6"
      />
    </svg>
  ),
};

/**
 * The style as a small drawing of each, in the value column like the icon
 * and the position. The name is the tooltip and the accessible label, and
 * the canvas shows the real result.
 */
export function SignatureStyleChoice(props: {
  control: SegmentedControl;
  id: string;
  size?: FieldSize;
}) {
  return (
    <div class={controls.segmented} data-size={props.size ?? 'sm'}>
      <SegmentedField
        adapt
        id={props.id}
        size={props.size ?? 'sm'}
        value={props.control.value()}
        onChange={props.control.set}
        items={props.control.options().map(option => ({
          value: option.key,
          label: (
            <span title={option.label} role="img" aria-label={option.label}>
              {STYLE_GLYPHS[option.key as FrameSignature['style']]()}
            </span>
          ),
        }))}
      />
    </div>
  );
}

/** The platform icons in place of their names; the name stays as the accessible label. */
export function SignatureIconChoice(props: {
  control: SegmentedControl;
  id: string;
  size?: FieldSize;
}) {
  return (
    <div class={controls.segmented} data-size={props.size ?? 'sm'}>
      <SegmentedField
        adapt
        id={props.id}
        size={props.size ?? 'sm'}
        value={props.control.value()}
        onChange={props.control.set}
        items={props.control.options().map(option => ({
          value: option.key,
          label: (
            <span title={option.label} role="img" aria-label={option.label}>
              <Show
                when={option.key !== 'null'}
                fallback={
                  <svg
                    class={styles.glyph}
                    width={14}
                    height={14}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M5.6 18.4 18.4 5.6" />
                  </svg>
                }
              >
                <PlatformIcon
                  class={styles.glyph}
                  platform={option.key as SignaturePlatform}
                  size={14}
                />
              </Show>
            </span>
          ),
        }))}
      />
    </div>
  );
}

const POSITION_X: Record<SignaturePosition, number> = {
  'bottom-left': 4,
  'bottom-center': 8.5,
  'bottom-right': 13,
};

/** Each position as a small frame with the mark where it would sit. */
export function SignaturePositionChoice(props: {
  control: SegmentedControl;
  id: string;
  size?: FieldSize;
}) {
  return (
    <div class={controls.segmented} data-size={props.size ?? 'sm'}>
      <SegmentedField
        adapt
        id={props.id}
        size={props.size ?? 'sm'}
        value={props.control.value()}
        onChange={props.control.set}
        items={props.control.options().map(option => ({
          value: option.key,
          label: (
            <span title={option.label} role="img" aria-label={option.label}>
              <svg
                class={styles.glyph}
                width={22}
                height={16}
                viewBox="0 0 22 16"
                fill="none"
              >
                <rect
                  x="1"
                  y="1"
                  width="20"
                  height="14"
                  rx="3"
                  stroke="currentColor"
                  stroke-width="1.5"
                  opacity="0.55"
                />
                <rect
                  x={POSITION_X[option.key as SignaturePosition]}
                  y="10"
                  width="5"
                  height="2.5"
                  rx="1.25"
                  fill="currentColor"
                />
              </svg>
            </span>
          ),
        }))}
      />
    </div>
  );
}
