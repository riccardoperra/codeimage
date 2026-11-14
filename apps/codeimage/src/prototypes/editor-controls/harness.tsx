import {EditorConfigStore} from '@codeimage/store/editor/config.store';
import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {getThemeStore} from '@codeimage/store/theme/theme.store';
import {VersionStore} from '@codeimage/store/version/version.store';
import type {JSX} from 'solid-js';
import {createSignal, onCleanup, onMount, Show, Suspense} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {provideState} from 'statebuilder';
import {EditorPageSkeleton} from '../../pages/Editor/components/EditorSkeleton';
import {CommandMenu} from './command-menu/CommandMenu';
import './harness.css';
import {createEditorControlsModel} from './model';
import type {Variant} from './contract';
import {letterKeys, numberKeys, Picker} from './picker/Picker';
import {createStage} from './stage';
import type {ThemePickerSlotProps} from './theme-styles/ThemePicker';
import {ThemePicker} from './theme-styles/ThemePicker';
import {setThemeStyle, THEME_STYLES, themeStyle} from './theme-styles/style';

interface HarnessProps {
  variants: readonly Variant[];
  /** Adds the theme style picker beside the variant picker. */
  themeStyles?: boolean;
}

const CONTROLS =
  'a[href], button, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

/**
 * The pills float over the page. Where they would cover a control of the
 * page, typically the production header on a narrow window, the page starts
 * under them. The check measures the page as if it were not moved.
 */
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

function Harness(props: HarnessProps) {
  const model = createEditorControlsModel();
  // A fresh object on every switch or replay, so the keyed Show re-mounts.
  const [mounted, setMounted] = createSignal({
    // oxlint-disable-next-line solid/reactivity -- the variant list never changes
    index: initialIndex(props.variants.length),
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
    setMounted({index});
  };

  const styleNames = THEME_STYLES.map(style => style.name);
  const styleIndex = () =>
    THEME_STYLES.findIndex(style => style.id === themeStyle());

  return (
    <div
      class="proto-harness"
      data-offset={chrome.offset() === undefined ? undefined : ''}
      style={{'--proto-offset': `${chrome.offset() ?? 0}px`}}
    >
      <div class="proto-variant" ref={page}>
        <Show when={mounted()} keyed>
          {({index}) => {
            // Created outside the JSX: a call in a prop compiles to a getter
            // and would build a new stage on every read.
            const stage = createStage();
            const BoundThemePicker = (slot: ThemePickerSlotProps) => (
              <ThemePicker
                {...slot}
                model={model}
                stage={stage}
                style={themeStyle()}
              />
            );
            requestAnimationFrame(chrome.measure);
            return (
              <>
                <Dynamic
                  component={props.variants[index].component}
                  model={model}
                  stage={stage}
                  ThemePicker={BoundThemePicker}
                />
                {/* One menu for every layout, bound to the shortcut here. */}
                <Show when={!props.variants[index].noCommandMenu}>
                  <CommandMenu model={model} stage={stage} />
                </Show>
              </>
            );
          }}
        </Show>
      </div>
      <div class="proto-pickers" ref={pills} data-prototype-chrome>
        <Picker
          label="Prototype variants"
          names={props.variants.map(variant => variant.name)}
          active={mounted().index}
          onSelect={select}
          keys={numberKeys}
          onReplay={() => setMounted(({index}) => ({index}))}
        />
        <Show when={props.themeStyles}>
          <Picker
            label="Theme styles"
            names={styleNames}
            active={styleIndex()}
            onSelect={index => setThemeStyle(THEME_STYLES[index].id)}
            keys={letterKeys(styleNames)}
            disabled={props.variants[mounted().index].ownThemePicker}
          />
        </Show>
      </div>
    </div>
  );
}

/** Loads the editor stores like the `/` route, then shows one variant at a time behind the picker. */
export function PrototypeRoute(props: HarnessProps): JSX.Element {
  getThemeStore().loadThemes();
  const editorConfig = provideState(EditorConfigStore);
  const versionState = provideState(VersionStore);

  return (
    <Suspense fallback={<EditorPageSkeleton />}>
      <Show
        when={editorConfig.get.ready && versionState.ready()}
        fallback={<EditorPageSkeleton />}
      >
        {/* Same as the `/` route, which passes an undefined snippet id
            despite the string type: the prototype edits the local document. */}
        <EditorSyncProvider snippetId={undefined!}>
          <Harness variants={props.variants} themeStyles={props.themeStyles} />
        </EditorSyncProvider>
      </Show>
    </Suspense>
  );
}
