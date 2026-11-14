import {getAssetsStore} from '@codeimage/store/assets/assets';
import type {
  FrameSignature as Signature,
  FrameState,
  SignaturePlatform,
  SignatureStyle,
} from '@codeimage/store/frame/model';
import {
  displayHandle,
  githubLogin,
  initials,
} from '@codeimage/store/frame/signature';
import {createSignal, Match, Show, Switch} from 'solid-js';
import * as styles from './FrameSignature.css';
import {platformIconPaths} from './platformIcons';
import {createSignatureTone} from './signatureTone';

// Height of each style plus 20px under it and 16px over it, so the code
// window never runs under the signature.
const RESERVED_SPACE: Record<SignatureStyle, number> = {
  minimal: 20 + 23 + 16,
  pill: 20 + 36 + 16,
  card: 20 + 64 + 16,
};

export function framePadding(
  padding: number,
  signature: FrameState['signature'],
) {
  if (!signature) return `${padding}px`;
  const bottom = Math.max(padding, RESERVED_SPACE[signature.style]);
  return `${padding}px ${padding}px ${bottom}px`;
}

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
          width={props.size}
          height={props.size}
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
  const url = () => {
    const avatar = props.signature.avatar;
    if (!avatar) return null;
    if (avatar !== 'github') return assets.getAsset(avatar)()?.url ?? null;
    const login = githubLogin(props.signature.handle);
    return login
      ? `https://avatars.githubusercontent.com/${login}?s=128`
      : null;
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
        crossOrigin="anonymous"
        onError={() => setFailed(url())}
      />
    </Show>
  );
}

/** The signature itself, without its place in the frame. */
export function SignatureMark(props: {signature: Signature}) {
  const handle = () => displayHandle(props.signature);
  return (
    <Switch>
      <Match when={props.signature.style === 'minimal'}>
        <div class={styles.minimal}>
          <PlatformIcon platform={props.signature.platform} size={17} />
          <span class={styles.text}>{handle()}</span>
        </div>
      </Match>
      <Match when={props.signature.style === 'pill'}>
        <div
          class={styles.pill}
          classList={{[styles.pillWithIcon]: !!props.signature.platform}}
        >
          <PlatformIcon platform={props.signature.platform} size={16} />
          <span class={styles.text}>{handle()}</span>
        </div>
      </Match>
      <Match when={props.signature.style === 'card'}>
        <div class={styles.card}>
          <Avatar signature={props.signature} />
          <div class={styles.cardText}>
            <span class={styles.cardName}>
              {props.signature.name?.trim() ||
                props.signature.handle.trim().replace(/^@/, '')}
            </span>
            <span class={styles.cardHandle}>
              <PlatformIcon platform={props.signature.platform} size={13} />
              <span class={styles.text}>{handle()}</span>
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
}) {
  const tone = createSignatureTone(() => props.background);
  return (
    <Show when={props.signature}>
      {signature => (
        <div
          class={`${styles.slot} ${styles.align[signature().position]} ${
            styles.tone[tone()]
          }`}
          data-frame-signature={signature().position}
          data-signature-style={signature().style}
          data-signature-tone={tone()}
        >
          <SignatureMark signature={signature()} />
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
