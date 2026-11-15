import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {JSX} from 'solid-js';
import {createResource, createSignal, onCleanup, onMount, Show} from 'solid-js';
import {EditorHost} from '../editor-controls/EditorHost';
import {numberKeys, Picker} from '../editor-controls/picker/Picker';
import * as styles from '../editor-controls/picker/picker-route.css';
import {createStage} from '../editor-controls/stage';
import type {AnimateConfig} from './Screen';
import {AnimateScreen, BASE_CONFIG} from './Screen';
import {getAnimateStore} from './store';

export interface AnimateVariant {
  name: string;
  /** The position on the route's axis, in a phrase. */
  axis: string;
  config: Partial<AnimateConfig>;
}

const CONTROLS =
  'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

// PickerRoute's offset: where the pill would cover a control of the page,
// the page starts under it.
function createChromeOffset(
  pills: () => HTMLElement | undefined,
  page: () => HTMLElement | undefined,
) {
  const [offset, setOffset] = createSignal<number>();
  const measure = () => {
    const chrome = pills();
    const content = page();
    if (!chrome || !content) return;
    const boxes = [...chrome.children].map(el => el.getBoundingClientRect());
    const bottom = Math.max(...boxes.map(box => box.bottom));
    const shift = offset() ?? 0;
    const covered = [...content.querySelectorAll(CONTROLS)].some(el => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.top - shift > bottom) return false;
      return boxes.some(
        box =>
          r.left < box.right &&
          r.right > box.left &&
          r.top - shift < box.bottom &&
          r.bottom - shift > box.top,
      );
    });
    setOffset(covered ? Math.ceil(bottom) + 12 : undefined);
  };
  onMount(() => {
    const observer = new ResizeObserver(() => requestAnimationFrame(measure));
    const chrome = pills();
    if (chrome) observer.observe(chrome);
    window.addEventListener('resize', measure);
    onCleanup(() => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    });
  });
  return {offset, measure};
}

function initialIndex(count: number): number {
  const requested = parseInt(
    new URLSearchParams(location.search).get('v') ?? '',
    10,
  );
  return requested >= 1 && requested <= count ? requested - 1 : 0;
}

function Variants(props: {
  variants: readonly AnimateVariant[];
  autoplay: boolean;
}) {
  const stage = createStage();
  const store = getAnimateStore();
  const [mounted, setMounted] = createSignal({
    // oxlint-disable-next-line solid/reactivity -- the variant list never changes
    index: initialIndex(props.variants.length),
    // oxlint-disable-next-line solid/reactivity -- read once, at load
    play: props.autoplay,
  });
  let pills: HTMLDivElement | undefined;
  let page: HTMLDivElement | undefined;
  const chrome = createChromeOffset(
    () => pills,
    () => page,
  );

  const select = (index: number) => {
    if (index < 0 || index >= props.variants.length) return;
    const url = new URL(location.href);
    url.searchParams.set('v', String(index + 1));
    history.replaceState(history.state, '', url);
    store.actions.edit();
    setMounted({index, play: props.autoplay});
  };

  return (
    <div
      class={styles.harness}
      data-offset={chrome.offset() === undefined ? undefined : ''}
      style={assignInlineVars({[styles.offset]: `${chrome.offset() ?? 0}px`})}
    >
      <div class={styles.variant} ref={page}>
        <Show when={mounted()} keyed>
          {({index, play}) => {
            requestAnimationFrame(chrome.measure);
            return (
              <AnimateScreen
                config={{...BASE_CONFIG, ...props.variants[index].config}}
                stage={stage}
                store={store}
                autoplay={play}
              />
            );
          }}
        </Show>
      </div>
      <div class={styles.pickers} ref={pills}>
        <Picker
          class={styles.pill}
          label="Prototype variants"
          names={props.variants.map(variant => variant.name)}
          active={mounted().index}
          onSelect={select}
          keys={numberKeys}
          onReplay={() => {
            store.actions.edit();
            setMounted(({index}) => ({index, play: true}));
          }}
        />
      </div>
    </div>
  );
}

// Waits for the local document, so the prototype's steps start from the
// tabs it holds rather than from the defaults it replaces.
function AfterDocument(props: {children: JSX.Element}) {
  const sync = getEditorSyncAdapter()!;
  const [loaded] = createResource(() =>
    sync
      .indexedDbState()
      .catch(() => null)
      .then(() => new Promise(resolve => setTimeout(resolve, 50)))
      .then(() => true),
  );
  return <Show when={loaded()}>{props.children}</Show>;
}

/** One prototype route: its variants behind the picker pill. */
export function AnimateRoute(props: {
  variants: readonly AnimateVariant[];
  /** Plays the animation once each time a variant mounts. */
  autoplay?: boolean;
}): JSX.Element {
  return (
    <EditorHost>
      <AfterDocument>
        <Variants
          variants={props.variants}
          autoplay={props.autoplay ?? false}
        />
      </AfterDocument>
    </EditorHost>
  );
}
