import {Button} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import type {JSX} from 'solid-js';
import {createSignal, onCleanup, onMount, Show} from 'solid-js';
import {Footer} from '../../../../components/Footer/Footer';
import {FrameToolbar} from '../../../../components/Toolbar/FrameToolbar';
import {Toolbar} from '../../../../components/Toolbar/Toolbar';
import type {VariantMeta, VariantProps} from '../../contract';
import type {ControlId} from '../../model';
import {ThemeSwatch} from '../../ThemeSwatch';
import type {Action} from './commands';
import type {DockApi} from './context';
import {createMediaQuery, DockContext, isKeyboardClick} from './context';
import {SegmentedChoice, SelectChoice} from './controls';
import './dock.css';
import type {PanelId} from './fields';
import {createFields} from './fields';
import {createFrameGuard} from './guard';
import {CodeIcon, PaddingIcon, SearchIcon, SlidersIcon} from './icons';
import {createPreviewSession, shownTheme} from './preview';
import {tokens} from './tokens.css';
import {Tray} from './Tray';

export const meta: VariantMeta = {
  name: 'Dock',
  axis: 'Interaction model: a dock of the most used controls, trays that preview, and a command menu',
};

const isApple = /Mac|iPhone|iPad/.test(navigator.platform);

interface DockItemProps {
  panel: PanelId;
  /** What the item sets. The phone bar shows it under the icon. */
  label: string;
  /** The value in use. Wide windows show it in place of the label. */
  value?: string;
  /** For a value the icon already shows, which then stays out of the text. */
  quiet?: boolean;
  icon: JSX.Element;
  open: boolean;
  compact: boolean;
  onToggle: (panel: PanelId, event: MouseEvent) => void;
}

function DockItem(props: DockItemProps) {
  return (
    <Button
      class="dock-item"
      theme={'secondary'}
      variant={'ghost'}
      size={'sm'}
      leftIcon={props.icon}
      data-panel={props.panel}
      aria-label={props.value ? `${props.label}: ${props.value}` : props.label}
      aria-haspopup="dialog"
      aria-expanded={props.open}
      onClick={(event: MouseEvent) => props.onToggle(props.panel, event)}
    >
      <span class="dock-item-text">
        {props.compact || props.quiet
          ? props.label
          : (props.value ?? props.label)}
      </span>
    </Button>
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
  const [previewKey, setPreviewKey] = createSignal<string>();
  const [instant, setInstant] = createSignal(false);
  const session = createPreviewSession(setPreviewKey);

  let bar: HTMLDivElement | undefined;
  let canvas: HTMLDivElement | undefined;
  let root: HTMLDivElement | undefined;
  let trigger: HTMLElement | undefined;

  const inset = createFrameGuard(() => canvas);

  const open = (next: PanelId) => {
    session.cancel();
    setPanel(next);
  };
  const close = () => {
    session.cancel();
    setPanel(undefined);
  };

  const dock: DockApi = {
    model: props.model,
    stage: props.stage,
    fields,
    session,
    previewKey,
    panel,
    compact,
    open,
    close,
    keep: change => {
      session.preview(change);
      session.commit();
    },
    closeAfterPick: byKeyboard => {
      if (byKeyboard || canHover()) close();
    },
  };

  const toggle = (next: PanelId, event: MouseEvent) => {
    if (panel() === next) {
      close();
      return;
    }
    // The kit's button does not hand its element to the handler.
    if (event.target instanceof Element) {
      trigger = event.target.closest<HTMLElement>('button') ?? undefined;
    }
    setInstant(isKeyboardClick(event));
    open(next);
  };

  // Switching variants unmounts the dock with a preview still on the canvas.
  onCleanup(session.cancel);

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = isApple ? event.metaKey : event.ctrlKey;
      if (!modifier || event.altKey || event.shiftKey) return;
      if (event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      event.stopPropagation();
      if (panel() === 'commands') {
        close();
        return;
      }
      if (!panel() && document.activeElement instanceof HTMLElement) {
        trigger = document.activeElement;
      }
      setInstant(true);
      open('commands');
    };
    // Capture, so that the code editor does not take the key first.
    window.addEventListener('keydown', onKeyDown, true);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown, true));
  });

  // The production Export button owns the dialog, in the header on wide
  // windows and in the bar on a phone. It is the page's one primary button.
  // The frame lets the tray close and hand focus back first.
  const exportImage = () =>
    requestAnimationFrame(() =>
      root
        ?.querySelector<HTMLElement>(
          '[data-cui="button"][data-theme="primary"]',
        )
        ?.click(),
    );

  const actions = (): Action[] => [
    {label: 'Export image…', note: 'Ctrl S', run: exportImage},
    {label: 'Randomize theme and style', run: props.stage.randomize},
    ...(props.stage.canFormat()
      ? [{label: 'Format code', run: () => void props.stage.format()}]
      : []),
  ];

  const isOpen = (id: PanelId) => panel() === id;
  const optionLabel = (id: ControlId) => {
    const choice = fields.choice(id);
    return choice?.options().find(option => option.key === choice.value())
      ?.label;
  };
  const label = (id: ControlId, fallback: string) =>
    props.model.control(id)?.label() ?? fallback;
  const background = () => fields.control('frame.background', 'background');
  const item = (id: PanelId) => ({
    panel: id,
    open: isOpen(id),
    compact: compact(),
    onToggle: toggle,
  });

  return (
    <DockContext.Provider value={dock}>
      <div
        ref={root}
        class={`dock-root ${tokens}`}
        data-panel={panel()}
        data-compact={compact() ? '' : undefined}
      >
        <Toolbar canvasRef={props.stage.exportRef()} />

        {/*
          The dock and its tray come before the canvas in the document, and
          CSS puts them under it. The code editor keeps the Tab key, so
          controls after it could not be reached from the keyboard.
        */}
        <div class="dock-bar-row" ref={bar}>
          <div
            class="dock-bar dock-island"
            role="toolbar"
            aria-label="Editor controls"
          >
            <DockItem
              {...item('themes')}
              label={label('editor.theme', 'Theme')}
              value={shownTheme(props.model)?.name}
              icon={
                <Show when={shownTheme(props.model)}>
                  {theme => <ThemeSwatch theme={theme()} size={22} />}
                </Show>
              }
            />
            <DockItem
              {...item('background')}
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
                    {...item('padding')}
                    label={label('frame.padding', 'Padding')}
                    value={optionLabel('frame.padding')}
                    icon={<PaddingIcon />}
                  />
                  <DockItem
                    {...item('language')}
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
                      <SegmentedChoice control={control()} />
                    </div>
                  </div>
                )}
              </Show>
              <Show when={fields.choice('editor.language')}>
                {control => (
                  <div
                    class="dock-field dock-field-language"
                    title={control().label()}
                    onPointerDown={close}
                  >
                    <SelectChoice control={control()} />
                  </div>
                )}
              </Show>
            </Show>
            <DockItem
              {...item('font')}
              label={label('font.family', 'Font')}
              value={fields.fontName()}
              quiet
              icon={
                <span
                  class="dock-font-icon"
                  style={{'font-family': `"${fields.fontName()}", monospace`}}
                >
                  Aa
                </span>
              }
            />
            <DockItem {...item('more')} label="More" icon={<SlidersIcon />} />
            <Show when={!compact()}>
              <Button
                class="dock-item"
                theme={'secondary'}
                variant={'ghost'}
                size={'sm'}
                leftIcon={<SearchIcon />}
                aria-label="Search themes and options"
                aria-haspopup="dialog"
                aria-expanded={isOpen('commands')}
                onClick={(event: MouseEvent) => toggle('commands', event)}
              >
                <kbd class="dock-kbd">{isApple ? '⌘K' : 'Ctrl K'}</kbd>
              </Button>
            </Show>
            <Show when={exportInBar}>
              <div class="dock-bar-export" onClick={close}>
                <props.stage.ExportButton />
              </div>
            </Show>
          </div>

          <Show when={!compact()}>
            <div class="dock-frame-actions dock-island">
              <FrameToolbar frameRef={props.stage.exportRef()} />
            </div>
          </Show>
        </div>

        <Tray
          actions={actions()}
          bar={() => bar}
          trigger={() => trigger}
          instant={instant()}
        />

        <main class="dock-stage dock-island">
          <div
            class="dock-canvas"
            ref={canvas}
            style={{'padding-bottom': `${inset()}px`}}
          >
            <props.stage.Canvas />
          </div>
          <Show when={!compact()}>
            <Footer />
          </Show>
        </main>
      </div>
    </DockContext.Provider>
  );
}
