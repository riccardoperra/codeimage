import {isAssetUrl} from '@codeimage/store/assets/assetIds';
import type {FrameMedia} from './frameMedia';
import type {
  FrameSignature as Signature,
  FrameState,
  SignaturePlatform,
} from '@codeimage/store/frame/model';
import {displayHandle, initials} from '@codeimage/store/frame/signature';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {ParentProps} from 'solid-js';
import {
  createEffect,
  createSignal,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from 'solid-js';
import * as styles from './FrameSignature.css';
import {platformIconPaths} from './platformIcons';

export {
  frameBottomPadding,
  framePadding,
  signatureScale,
} from './signatureLayout';

const scaledPx = (value: number) => `calc(${value}px * ${styles.scale})`;

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
          style={{width: scaledPx(props.size), height: scaledPx(props.size)}}
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

function Avatar(props: {signature: Signature; url: string | null}) {
  const url = () => props.url;
  const [failed, setFailed] = createSignal<string | null>(null);
  const onError = () => setFailed(url());
  return (
    <Show
      when={url() && failed() !== url()}
      fallback={
        <div class={styles.monogram} aria-hidden="true">
          {initials(props.signature)}
        </div>
      }
    >
      <img class={styles.avatar} src={url()!} alt="" onError={onError} />
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
export function SignatureMark(props: {
  signature: Signature;
  avatar: string | null;
  ref?: (element: HTMLElement) => void;
}) {
  const handle = () => displayHandle(props.signature);
  return (
    <Switch>
      <Match when={props.signature.style === 'minimal'}>
        <div ref={element => props.ref?.(element)} class={styles.minimal}>
          <PlatformIcon platform={props.signature.platform} size={16} />
          <FitText>{handle()}</FitText>
        </div>
      </Match>
      <Match when={props.signature.style === 'pill'}>
        <div
          ref={element => props.ref?.(element)}
          class={styles.pill}
          classList={{[styles.pillWithIcon]: !!props.signature.platform}}
        >
          <PlatformIcon platform={props.signature.platform} size={14} />
          <FitText>{handle()}</FitText>
        </div>
      </Match>
      <Match when={props.signature.style === 'card'}>
        <div ref={element => props.ref?.(element)} class={styles.card}>
          <Avatar signature={props.signature} url={props.avatar} />
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
  media: FrameMedia;
  background: string | null | undefined;
  /** From `signatureScale()`. */
  scale: number;
  /** Makes the signature a button that opens its settings, in the editor only. */
  onEdit?: () => void;
  editLabel?: string;
  /** Receives the visible mark: the edit button, or the mark itself. */
  markRef?: (element: HTMLElement) => void;
}) {
  const tone = () => props.media.tone;
  // Keep the editor's focus and selection, and start no drag.
  const preventSelection = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const editSignature = (event: MouseEvent) => {
    event.stopPropagation();
    props.onEdit?.();
  };
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
            fallback={
              <SignatureMark
                signature={signature()}
                avatar={props.media.avatar}
                ref={props.markRef}
              />
            }
          >
            <button
              ref={element => props.markRef?.(element)}
              type="button"
              class={styles.edit}
              data-signature-style={signature().style}
              aria-label={props.editLabel}
              title={props.editLabel}
              onPointerDown={preventSelection}
              onMouseDown={preventSelection}
              onClick={editSignature}
            >
              <SignatureMark
                signature={signature()}
                avatar={props.media.avatar}
              />
            </button>
          </Show>
        </div>
      )}
    </Show>
  );
}
