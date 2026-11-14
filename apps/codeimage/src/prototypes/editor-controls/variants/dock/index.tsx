import {Button} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {Popover} from '@kobalte/core/popover';
import type {JSX} from 'solid-js';
import {createSignal, For, onCleanup, onMount, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {Footer} from '../../../../components/Footer/Footer';
import {sidebarTheme} from '../../../../components/PropertyEditor/EditorSidebar.css';
import {FrameToolbar} from '../../../../components/Toolbar/FrameToolbar';
import {Toolbar} from '../../../../components/Toolbar/Toolbar';
import {shownTheme} from '../../command-menu/listed-model';
import {commandMenu} from '../../command-menu/state';
import type {VariantMeta, VariantProps} from '../../contract';
import type {ControlId} from '../../model';
import {themeStyle} from '../../theme-styles/style';
import {ThemeSwatch} from '../../ThemeSwatch';
import type {DockApi} from './context';
import {
  closeOnEscape,
  createMediaQuery,
  DockContext,
  inPrototypeChrome,
  isKeyboardClick,
} from './context';
import {fieldId, SegmentedChoice, SelectChoice} from '../../controls/fields';
import './dock.css';
import type {PanelId} from './fields';
import {createFields, PLACES} from './fields';
import {CodeIcon, PaddingIcon, SearchIcon, SlidersIcon} from './icons';
import {PANELS} from './panels';
import {Sheet} from './Sheet';
import {tokens} from './tokens.css';

export const meta: VariantMeta = {
  name: 'Dock',
  axis: 'Interaction model: a dock that floats over the canvas, popovers that preview, and a command menu',
};

/** Space between the dock and the edge of the canvas, and above the dock. */
const MARGIN = 12;
const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DockItemProps {
  panel: PanelId;
  /** What the item sets. The phone bar shows it under the icon. */
  label: string;
  /** The value in use. Wide windows show it in place of the label. */
  value?: string;
  /** For a value the icon already shows, which then stays out of the text. */
  quiet?: boolean;
  /** Every value the item can show, which keeps it as wide as the longest. */
  values?: readonly string[];
  icon: JSX.Element;
}

interface DockItemHost {
  open: (panel: PanelId) => boolean;
  compact: () => boolean;
  /** The phone bar's buttons open the sheet. */
  onToggle: (panel: PanelId, event: MouseEvent) => void;
  onOpenChange: (panel: PanelId, open: boolean) => void;
  /** Where the popover mounts, inside the layout so that its tokens reach it. */
  mount: () => HTMLElement | undefined;
  /** The box a popover of this panel hangs above. */
  anchor: (panel: PanelId, trigger?: HTMLElement) => DOMRect | undefined;
  /** Width in px for a popover that spans the dock. */
  width: (panel: PanelId) => number | undefined;
}

function DockItem(props: DockItemProps & {host: DockItemHost}) {
  const [instant, setInstant] = createSignal(false);
  const isOpen = () => props.host.open(props.panel);
  const text = () =>
    props.host.compact() || props.quiet
      ? props.label
      : (props.value ?? props.label);
  // Hidden copies of the other values share the label's cell, so the dock
  // keeps one width whatever is applied. A dock that grew would wrap its row
  // on a narrow window and move the frame.
  const ItemText = () => (
    <span class="dock-item-text">
      <span>{text()}</span>
      <Show when={!props.host.compact()}>
        <For each={props.values}>
          {value => (
            <span class="dock-item-sizer" aria-hidden="true">
              {value}
            </span>
          )}
        </For>
      </Show>
    </span>
  );
  const button = {
    class: 'dock-item',
    theme: 'secondary',
    variant: 'ghost',
    size: 'sm',
    get leftIcon() {
      return props.icon;
    },
    get 'data-panel'() {
      return props.panel;
    },
    get 'aria-label'() {
      return props.value ? `${props.label}: ${props.value}` : props.label;
    },
  } as const;

  return (
    <Show
      when={!props.host.compact()}
      fallback={
        <Button
          {...button}
          aria-haspopup="dialog"
          aria-expanded={isOpen()}
          onClick={(event: MouseEvent) =>
            props.host.onToggle(props.panel, event)
          }
        >
          <ItemText />
        </Button>
      }
    >
      <Popover
        open={isOpen()}
        onOpenChange={open => props.host.onOpenChange(props.panel, open)}
        placement="top"
        gutter={8}
        overflowPadding={8}
        getAnchorRect={trigger => props.host.anchor(props.panel, trigger)}
      >
        <Popover.Trigger
          as={Button}
          {...button}
          // Opened from the keyboard, so it appears without motion.
          onClick={(event: MouseEvent) => setInstant(isKeyboardClick(event))}
        >
          <ItemText />
        </Popover.Trigger>
        <Popover.Portal mount={props.host.mount()}>
          <Popover.Content
            class={`dock-popover ${sidebarTheme}`}
            aria-label={PANELS[props.panel].title}
            data-panel={props.panel}
            data-instant={instant() ? '' : undefined}
            style={{
              width: props.host.width(props.panel)
                ? `${props.host.width(props.panel)}px`
                : undefined,
            }}
            onOpenAutoFocus={event => {
              // The theme picker focuses the applied theme itself.
              event.preventDefault();
              const content = event.currentTarget as HTMLElement;
              queueMicrotask(() => {
                if (content.contains(document.activeElement)) return;
                (
                  content.querySelector<HTMLElement>(FOCUSABLE) ?? content
                ).focus();
              });
            }}
            onPointerDownOutside={event => {
              if (inPrototypeChrome(event.target)) event.preventDefault();
            }}
            onFocusOutside={event => {
              if (inPrototypeChrome(event.target)) event.preventDefault();
            }}
            on:keydown={closeOnEscape(() =>
              props.host.onOpenChange(props.panel, false),
            )}
          >
            <Dynamic component={PANELS[props.panel].Body} />
          </Popover.Content>
        </Popover.Portal>
      </Popover>
    </Show>
  );
}

export default function Dock(props: VariantProps) {
  const fields = createFields(props.model);
  // The production header shows Export only when the page loaded on a wide
  // window, so the bar offers it in exactly the other case.
  const exportInBar = useModality() === 'mobile';
  const compact = createMediaQuery('(max-width: 767px)');
  const canHover = createMediaQuery('(hover: hover) and (pointer: fine)');

  const [panel, setPanel] = createSignal<PanelId>();
  const [overlays, setOverlays] = createSignal<HTMLDivElement>();
  const [dockHeight, setDockHeight] = createSignal(0);
  const [dockWidth, setDockWidth] = createSignal(0);

  let row!: HTMLDivElement;
  let bar!: HTMLDivElement;
  let sheetTrigger: HTMLElement | undefined;

  const close = () => setPanel(undefined);

  const dock: DockApi = {
    model: props.model,
    stage: props.stage,
    fields,
    ThemePicker: props.ThemePicker,
    panel,
    compact,
    close,
    closeAfterPick: byKeyboard => {
      if (byKeyboard || canHover()) close();
    },
  };

  // The islands of the dock, which wrap onto two lines on a narrow window.
  const islands = () => [...row.children].map(el => el.getBoundingClientRect());

  onMount(() => {
    const measure = () => {
      const boxes = islands();
      setDockHeight(row.offsetHeight);
      setDockWidth(
        Math.max(...boxes.map(box => box.right)) -
          Math.min(...boxes.map(box => box.left)),
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    for (const island of row.children) observer.observe(island);
    onCleanup(() => observer.disconnect());
  });

  // The command menu needs the screen to itself, so an open panel makes way.
  onCleanup(commandMenu.beforeOpen(close));
  // A command for a control without a list of values opens its panel.
  onCleanup(commandMenu.setReveal(id => setPanel(PLACES[id].panel)));

  // The Aa list is one narrow column. Every other style is a row of cards as wide as the dock.
  const spansDock = (id: PanelId) => id === 'themes' && themeStyle() !== 'aa';

  const host: DockItemHost = {
    open: id => panel() === id,
    compact,
    mount: overlays,
    onToggle: (id, event) => {
      if (panel() === id) return close();
      // The kit's button does not hand its element to the handler.
      if (event.target instanceof Element) {
        sheetTrigger = event.target.closest<HTMLElement>('button') ?? undefined;
      }
      setPanel(id);
    },
    onOpenChange: (id, open) => {
      if (open) setPanel(id);
      else if (panel() === id) close();
    },
    // Every popover hangs above the bar, not above its own button inside it,
    // so they all start at one height. A wide one is centred on the dock.
    anchor: (id, trigger) => {
      const base = bar.getBoundingClientRect();
      const boxes = islands();
      const left = Math.min(...boxes.map(box => box.left));
      const across = spansDock(id)
        ? {x: left, width: dockWidth()}
        : (trigger?.getBoundingClientRect() ?? base);
      return new DOMRect(across.x, base.y, across.width, base.height);
    },
    width: id => (spansDock(id) ? dockWidth() : undefined),
  };

  const optionLabel = (id: ControlId) => {
    const choice = fields.choice(id);
    return choice?.options().find(option => option.key === choice.value())
      ?.label;
  };
  const label = (id: ControlId, fallback: string) =>
    props.model.control(id)?.label() ?? fallback;
  const background = () => fields.control('frame.background', 'background');

  return (
    <DockContext.Provider value={dock}>
      <div
        class={`dock-root ${tokens}`}
        data-compact={compact() ? '' : undefined}
        style={{'--dock-safe': `${dockHeight() + MARGIN * 2}px`}}
      >
        <Toolbar canvasRef={props.stage.exportRef()} />
        {/* Popovers mount here: inside the root for its tokens, out of its layout. */}
        <div class="dock-overlays" ref={setOverlays} />

        <div class="dock-body">
          {/*
            The dock comes before the canvas in the document, and CSS floats
            it over the canvas's bottom edge. The code editor keeps the Tab
            key, so controls after it could not be reached from the keyboard.
          */}
          <div class="dock-row" ref={row}>
            <div
              ref={bar}
              class="dock-bar dock-float"
              role="toolbar"
              aria-label="Editor controls"
            >
              <DockItem
                host={host}
                panel="themes"
                label={label('editor.theme', 'Theme')}
                value={shownTheme(props.model)?.name}
                values={props.model.themes().map(theme => theme.name)}
                icon={
                  <Show when={shownTheme(props.model)}>
                    {theme => <ThemeSwatch theme={theme()} size={22} />}
                  </Show>
                }
              />
              <DockItem
                host={host}
                panel="background"
                label={label('frame.background', 'Background')}
                icon={
                  <span
                    class="dock-fill"
                    data-hidden={background()?.visible() ? undefined : ''}
                    style={{background: background()?.value()}}
                  />
                }
              />
              <Show
                when={!compact()}
                fallback={
                  <>
                    <DockItem
                      host={host}
                      panel="padding"
                      label={label('frame.padding', 'Padding')}
                      value={optionLabel('frame.padding')}
                      icon={<PaddingIcon />}
                    />
                    <DockItem
                      host={host}
                      panel="language"
                      label={label('editor.language', 'Language')}
                      value={optionLabel('editor.language')}
                      icon={<CodeIcon />}
                    />
                  </>
                }
              >
                <Show when={fields.choice('frame.padding')}>
                  {control => (
                    <div
                      class="dock-field dock-field-padding"
                      role="group"
                      aria-label={control().label()}
                      title={control().label()}
                    >
                      <PaddingIcon />
                      <div class="dock-segmented">
                        <SegmentedChoice
                          control={control()}
                          id={fieldId('dock', control().id)}
                        />
                      </div>
                    </div>
                  )}
                </Show>
                <Show when={fields.choice('editor.language')}>
                  {control => (
                    <div
                      class="dock-field dock-field-language"
                      title={control().label()}
                    >
                      {/* Clears the bar, so the list starts where the popovers do. */}
                      <SelectChoice
                        control={control()}
                        id={fieldId('dock', control().id)}
                        gutter={18}
                      />
                    </div>
                  )}
                </Show>
              </Show>
              <DockItem
                host={host}
                panel="font"
                label={label('font.family', 'Font')}
                value={fields.fontName()}
                quiet
                icon={
                  <span
                    class="dock-font-icon"
                    style={{
                      'font-family': `"${fields.fontName()}", monospace`,
                    }}
                  >
                    Aa
                  </span>
                }
              />
              <DockItem
                host={host}
                panel="more"
                label="More"
                icon={<SlidersIcon />}
              />
              <Show when={!compact()}>
                <Button
                  class="dock-item"
                  theme={'secondary'}
                  variant={'ghost'}
                  size={'sm'}
                  leftIcon={<SearchIcon />}
                  aria-label="Search themes and options"
                  aria-haspopup="dialog"
                  aria-expanded={commandMenu.isOpen()}
                  onClick={commandMenu.open}
                >
                  <kbd class="dock-kbd">{commandMenu.shortcut}</kbd>
                </Button>
              </Show>
              <Show when={exportInBar}>
                <div class="dock-bar-export" onClick={close}>
                  <props.stage.ExportButton />
                </div>
              </Show>
            </div>

            <Show when={!compact()}>
              <div class="dock-frame-actions dock-float">
                <FrameToolbar frameRef={props.stage.exportRef()} />
              </div>
            </Show>
          </div>

          <Show when={compact()}>
            <Sheet bar={() => bar} trigger={() => sheetTrigger} />
          </Show>

          <main class="dock-stage dock-island">
            <div class="dock-canvas">
              <props.stage.Canvas />
            </div>
            <Show when={!compact()}>
              <div class="dock-footer">
                <Footer />
              </div>
            </Show>
          </main>
        </div>
      </div>
    </DockContext.Provider>
  );
}
