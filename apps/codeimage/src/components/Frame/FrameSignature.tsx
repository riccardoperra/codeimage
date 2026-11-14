import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import type {
  FrameSignature as Signature,
  FrameState,
  SignaturePlatform,
} from '@codeimage/store/frame/model';
import {avatarKey, loadAvatar} from '@codeimage/store/frame/avatar';
import {
  avatarSource,
  displayHandle,
  initials,
} from '@codeimage/store/frame/signature';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {ParentProps} from 'solid-js';
import {
  createEffect,
  createResource,
  createSignal,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
  untrack,
} from 'solid-js';
import * as styles from './FrameSignature.css';
import {platformIconPaths} from './platformIcons';
import {createSignatureTone} from './signatureTone';

export {framePadding, signatureScale} from './signatureLayout';

export function PlatformIcon(props: {
  platform: SignaturePlatform | null;
  size: number;
  class?: string;
}) {
  return (
    <Show when={props.platform}>
      {platform => (
        <svg
          class={props.class ?? styles.icon}
          style={{width: styles.px(props.size), height: styles.px(props.size)}}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d={platformIconPaths[platform()]} />
        </svg>
      )}
    </Show>
  );
}

function Avatar(props: {signature: Signature}) {
  const assets = getAssetsStore();
  const source = () =>
    props.signature.avatar === 'profile' ? avatarSource(props.signature) : null;
  const key = () => {
    const value = source();
    return value ? avatarKey(value) : null;
  };
  // Keyed by the source, so typing a handle does not refetch the same
  // avatar, and an avatar is only shown for the account it was loaded for.
  const [profileAvatar] = createResource(key, async loading => {
    const value = untrack(source);
    return {key: loading, url: value ? await loadAvatar(value) : null};
  });
  const url = () => {
    const avatar = props.signature.avatar;
    if (!avatar) return null;
    if (avatar === 'profile') {
      const loaded = profileAvatar.latest;
      return loaded && loaded.key === key() ? loaded.url : null;
    }
    return assets.getAsset(avatar)()?.url ?? null;
  };
  const [failed, setFailed] = createSignal<string | null>(null);
  return (
    <Show
      when={url() && failed() !== url()}
      fallback={
        <div class={styles.monogram} aria-hidden="true">
          {initials(props.signature)}
        </div>
      }
    >
      <img
        class={styles.avatar}
        src={url()!}
        alt=""
        onError={() => setFailed(url())}
      />
    </Show>
  );
}

/** Text that shows an ellipsis only when it measures wider than its box. */
function FitText(props: ParentProps<{class?: string}>) {
  let ref!: HTMLSpanElement;
  const [overflow, setOverflow] = createSignal(false);
  const measure = () => setOverflow(ref.scrollWidth > ref.clientWidth + 1);
  onMount(() => {
    const observer = new ResizeObserver(measure);
    observer.observe(ref);
    if (ref.parentElement) observer.observe(ref.parentElement);
    void document.fonts?.ready.then(measure);
    onCleanup(() => observer.disconnect());
  });
  createEffect(
    on(
      () => props.children,
      () => queueMicrotask(measure),
    ),
  );
  return (
    <span
      ref={ref}
      class={`${styles.text} ${props.class ?? ''}`}
      data-overflow={overflow() ? '' : undefined}
    >
      {props.children}
    </span>
  );
}

/** The signature itself, without its place in the frame. */
export function SignatureMark(props: {signature: Signature}) {
  const handle = () => displayHandle(props.signature);
  return (
    <Switch>
      <Match when={props.signature.style === 'minimal'}>
        <div class={styles.minimal}>
          <PlatformIcon platform={props.signature.platform} size={16} />
          <FitText>{handle()}</FitText>
        </div>
      </Match>
      <Match when={props.signature.style === 'pill'}>
        <div
          class={styles.pill}
          classList={{[styles.pillWithIcon]: !!props.signature.platform}}
        >
          <PlatformIcon platform={props.signature.platform} size={14} />
          <FitText>{handle()}</FitText>
        </div>
      </Match>
      <Match when={props.signature.style === 'card'}>
        <div class={styles.card}>
          <Avatar signature={props.signature} />
          <div class={styles.cardText}>
            <FitText class={styles.cardName}>
              {props.signature.name?.trim() ||
                props.signature.handle.trim().replace(/^@/, '')}
            </FitText>
            <span class={styles.cardHandle}>
              {/* As tall as the handle's capitals: Inter's cap height is 0.73em of 14px. */}
              <PlatformIcon
                class={styles.cardIcon}
                platform={props.signature.platform}
                size={10.5}
              />
              <FitText>{handle()}</FitText>
            </span>
          </div>
        </div>
      </Match>
    </Switch>
  );
}

export function FrameSignature(props: {
  signature: FrameState['signature'];
  background: string | null | undefined;
  /** From `signatureScale()`. */
  scale: number;
  /** Makes the signature a button that opens its settings, in the editor only. */
  onEdit?: () => void;
  editLabel?: string;
}) {
  const tone = createSignatureTone(() => props.background);
  return (
    <Show when={props.signature}>
      {signature => (
        <div
          class={`${styles.slot} ${styles.align[signature().position]} ${
            styles.tone[tone()]
          } ${isAssetUrl(props.background) ? styles.imageTone[tone()] : ''}`}
          data-frame-signature={signature().position}
          data-signature-style={signature().style}
          data-signature-tone={tone()}
          style={assignInlineVars({
            [styles.signatureScale]: String(props.scale),
          })}
        >
          <Show
            when={props.onEdit}
            fallback={<SignatureMark signature={signature()} />}
          >
            {onEdit => (
              <button
                type="button"
                class={styles.edit}
                data-signature-style={signature().style}
                aria-label={props.editLabel}
                title={props.editLabel}
                // Keeps the editor's focus and selection, and starts no drag.
                onPointerDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onMouseDown={event => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={event => {
                  event.stopPropagation();
                  onEdit()();
                }}
              >
                <SignatureMark signature={signature()} />
              </button>
            )}
          </Show>
        </div>
      )}
    </Show>
  );
}

/** The signature in the ink it would get on a background, for previews outside the frame. */
export function SignatureSwatch(props: {
  signature: Signature;
  background: string | null | undefined;
  class?: string;
}) {
  const tone = createSignatureTone(() => props.background);
  return (
    <div
      class={`${props.class ?? ''} ${styles.tone[tone()]}`}
      data-position={props.signature.position}
    >
      <SignatureMark signature={props.signature} />
    </div>
  );
}
