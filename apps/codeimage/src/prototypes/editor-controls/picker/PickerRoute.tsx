import type {JSX} from 'solid-js';
import {createSignal, onCleanup, onMount, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {CommandMenu} from '../command-menu/CommandMenu';
import type {Variant} from '../contract';
import {EditorHost} from '../EditorHost';
import {createEditorControlsModel} from '../model';
import {createStage} from '../stage';
import type {ThemePickerSlotProps} from '../theme-styles/ThemePicker';
import {ThemePicker} from '../theme-styles/ThemePicker';
import {themeStyle} from '../theme-styles/style';
import './picker-route.css';
import {numberKeys, Picker} from './Picker';

interface PickerRouteProps {
  variants: readonly Variant[];
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

function Variants(props: PickerRouteProps) {
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
                <CommandMenu model={model} stage={stage} />
              </>
            );
          }}
        </Show>
      </div>
      <div class="proto-pickers" ref={pills}>
        <Picker
          label="Prototype variants"
          names={props.variants.map(variant => variant.name)}
          active={mounted().index}
          onSelect={select}
          keys={numberKeys}
          onReplay={() => setMounted(({index}) => ({index}))}
        />
      </div>
    </div>
  );
}

/**
 * A comparison page: one variant at a time behind the pill of the prototype
 * skill, as the `theme-card` route uses it. The editor itself has no pill:
 * see `UnifiedEditor`.
 */
export function PickerRoute(props: PickerRouteProps): JSX.Element {
  return (
    <EditorHost>
      <Variants variants={props.variants} />
    </EditorHost>
  );
}
