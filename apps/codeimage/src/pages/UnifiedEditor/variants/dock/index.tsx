import {useI18n} from '@codeimage/locale';
import {signatureEditor} from '@codeimage/store/frame/signatureEditor';
import {Button, IconButton} from '@codeui/kit';
import {Popover} from '@kobalte/core/popover';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createEffect,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import type {JSX} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {sidebarTheme} from '../../../../components/PropertyEditor/EditorSidebar.css';
import type {AppLocaleEntries} from '../../../../i18n';
import {EditingControls} from '../../EditingControls';
import {CommandMenuButton} from '../../command-menu/CommandMenuButton';
import {shownTheme} from '../../command-menu/listed-model';
import {commandMenu} from '../../command-menu/state';
import type {VariantMeta, VariantProps} from '../../contract';
import {fieldId, SegmentedChoice, SelectChoice} from '../../controls/fields';
import {FrameActions} from '../../controls/FrameActions';
import {keepMarkToolbarAboveSelection} from '../../controls/mark-toolbar';
import {ShortcutHelp} from '../../controls/ShortcutHelp';
import {Footer} from '../../localized/Footer';
import type {ControlId} from '../../model';
import {SettingsIcon} from '../../shell/icons';
import {claimSettingsEntry, settings} from '../../shell/settings-state';
import {themeStyle} from '../../theme-styles/style';
import {ThemeSwatch} from '../../ThemeSwatch';
import {
  closeOnEscape,
  createMediaQuery,
  DockContext,
  isKeyboardClick,
} from './context';
import type {DockApi} from './context';
import * as styles from './dock.css';
import {createFields} from './fields';
import type {PanelId} from './fields';
import {CodeIcon, PaddingIcon, SearchIcon, SlidersIcon} from './icons';
import {PANELS, showMoreGroup} from './panels';
import {Sheet} from './Sheet';

export const meta: VariantMeta = {
  name: 'editor.dock',
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
  /** Where the popover mounts: inside the layout, out of its flow. */
  mount: () => HTMLElement | undefined;
  /** The box a popover of this panel hangs above. */
  anchor: (panel: PanelId, trigger?: HTMLElement) => DOMRect | undefined;
  /** Width in px for a popover that spans the dock. */
  width: (panel: PanelId) => number | undefined;
}

function DockItem(props: DockItemProps & {host: DockItemHost}) {
  const [t] = useI18n<AppLocaleEntries>();
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
    <span class={styles.itemText} data-dock-label>
      <span class={styles.itemCell}>{text()}</span>
      <Show when={!props.host.compact()}>
        <For each={props.values}>
          {value => (
            <span class={styles.itemSizer} aria-hidden="true">
              {value}
            </span>
          )}
        </For>
      </Show>
    </span>
  );
  const button = {
    class: styles.item,
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
            class={`${styles.popover} ${sidebarTheme}`}
            aria-label={t(PANELS[props.panel].title)}
            data-control-panel
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

/** The settings entry in the floating bar, beside Search. */
function BarSettings() {
  const [t] = useI18n<AppLocaleEntries>();
  claimSettingsEntry();
  return (
    <IconButton
      class={styles.item}
      theme={'secondary'}
      variant={'ghost'}
      size={'sm'}
      aria-label={t('editor.settings')}
      title={t('editor.settings')}
      aria-haspopup="dialog"
      aria-expanded={settings.isOpen()}
      data-settings-trigger
      onClick={() => settings.open()}
    >
      <SettingsIcon size={16} />
    </IconButton>
  );
}

export default function Dock(props: VariantProps) {
  const [t] = useI18n<AppLocaleEntries>();
  keepMarkToolbarAboveSelection();
  const fields = createFields(props.model);
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
  createEffect(() => {
    if (!props.pageState().editable) close();
  });

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

  // A click on the signature in the canvas opens More at the Signature group.
  onCleanup(
    signatureEditor.register(() => {
      showMoreGroup('signature');
      setPanel('more');
      // The panel mounts in the overlay layer on the next frame.
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            `.${styles.more} [data-control="signature.handle"] input`,
          )
          ?.focus({preventScroll: true}),
      );
    }),
  );
  // The command menu needs the screen to itself, so an open panel makes way.
  onCleanup(commandMenu.beforeOpen(close));
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
        class={styles.root}
        data-compact={compact() ? '' : undefined}
        style={assignInlineVars({
          [styles.safe]: `${dockHeight() + MARGIN * 2}px`,
        })}
      >
        {/* Popovers mount here: inside the root, out of its layout. */}
        <div class={styles.overlays} ref={setOverlays} />

        <div class={styles.body}>
          {/*
            The dock comes before the canvas in the document, and CSS floats
            it over the canvas's bottom edge. The code editor keeps the Tab
            key, so controls after it could not be reached from the keyboard.
          */}
          <div class={styles.row} ref={row} data-control-dock>
            <div
              ref={bar}
              class={`${styles.bar} ${styles.float}`}
              role="toolbar"
              aria-label={t('editor.editorControls')}
            >
              <EditingControls state={props.pageState()}>
                <DockItem
                  host={host}
                  panel="themes"
                  label={label('editor.theme', t('frame.theme'))}
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
                  label={label('frame.background', t('frame.background'))}
                  icon={
                    <span
                      class={styles.fill}
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
                        label={label('frame.padding', t('frame.padding'))}
                        value={optionLabel('frame.padding')}
                        icon={<PaddingIcon />}
                      />
                      <DockItem
                        host={host}
                        panel="language"
                        label={label('editor.language', t('frame.language'))}
                        value={optionLabel('editor.language')}
                        icon={<CodeIcon />}
                      />
                    </>
                  }
                >
                  <Show when={fields.choice('frame.padding')}>
                    {control => (
                      <div
                        class={`${styles.field} ${styles.fieldPadding}`}
                        role="group"
                        aria-label={control().label()}
                        title={control().label()}
                      >
                        <PaddingIcon />
                        <div
                          class={`${styles.segmented} ${styles.paddingChoice}`}
                        >
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
                        class={`${styles.field} ${styles.fieldLanguage}`}
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
                  label={label('font.family', t('frame.font'))}
                  value={fields.fontName()}
                  quiet
                  icon={
                    <span
                      class={styles.fontIcon}
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
                  label={t('editor.more')}
                  icon={<SlidersIcon />}
                />
              </EditingControls>
              <Show when={!compact()}>
                <CommandMenuButton>
                  {trigger => (
                    <Button
                      {...trigger}
                      class={styles.item}
                      theme={'secondary'}
                      variant={'ghost'}
                      size={'sm'}
                      leftIcon={<SearchIcon />}
                      aria-label={t('editor.searchOptions')}
                    >
                      <kbd class={styles.kbd}>{commandMenu.shortcut}</kbd>
                    </Button>
                  )}
                </CommandMenuButton>
                <BarSettings />
              </Show>
              <Show when={props.stage.compact()}>
                <div class={styles.barExport} onClick={close}>
                  <props.stage.ExportButton />
                </div>
              </Show>
            </div>

            <EditingControls state={props.pageState()}>
              <ShortcutHelp editable={props.pageState().editable} />
            </EditingControls>
            <Show when={!compact()}>
              <div class={`${styles.frameActions} ${styles.float}`}>
                <EditingControls state={props.pageState()}>
                  <FrameActions />
                </EditingControls>
              </div>
            </Show>
          </div>

          <Show when={compact()}>
            <Sheet bar={() => bar} trigger={() => sheetTrigger} />
          </Show>

          <main class={`${styles.stage} ${styles.island}`}>
            <div class={styles.canvas}>
              <props.stage.Canvas />
            </div>
            <Show when={!compact()}>
              <div class={styles.footer}>
                <Footer />
              </div>
            </Show>
          </main>
        </div>
      </div>
    </DockContext.Provider>
  );
}
