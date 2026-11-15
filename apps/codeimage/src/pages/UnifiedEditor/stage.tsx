import {ShortcutHelp} from './controls/ShortcutHelp';
import * as shortcutStyles from './controls/shortcut-help.css';
import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {useModality} from '@core/hooks/isMobile';
import {
  createEffect,
  createResource,
  createSignal,
  lazy,
  onCleanup,
  onMount,
  Show,
  Suspense,
} from 'solid-js';
import type {Accessor, Component} from 'solid-js';
import {untrackCommand} from 'statebuilder/commands';
import {FrameSkeleton} from '../../components/Frame/FrameSkeleton';
import {PreviewFrame} from '../../components/Frame/PreviewFrame';
import {SuspenseEditorItem} from '../../components/PropertyEditor/SuspenseEditorItem';
import {TerminalHost} from '../../components/Terminal/TerminalHost';
import {ThemeBoxSkeleton} from '../../components/ThemeSwitcher/ThemeBoxSkeleton';
import {themeBoxTerminalHost} from '../../components/ThemeSwitcher/ThemeSwitcher.css';
import type {EditorPageState} from './page-state';
import {ReadOnlyNotice} from './ReadOnlyNotice';
import {FitFrame} from './FitFrame';
import * as placeholderStyles from './frame-placeholder.css';
import type {ThemeEntry} from './model';
import {createExporter} from './shell/export';
import type {Exporter} from './shell/export';
import {ExportControl} from './shell/ExportControl';

const ManagedFrame = lazy(() =>
  import('../../components/Frame/ManagedFrame').then(m => ({
    default: m.ManagedFrame,
  })),
);

const CustomEditorPreview = lazy(
  () => import('../../components/CustomEditor/CustomEditorPreview'),
);

export interface Stage {
  /** Shared by the header and layouts, so Export has exactly one home. */
  readonly compact: Accessor<boolean>;
  /**
   * The live frame with the real CodeMirror editor. Render it once; it fills its
   * parent and zooms out when the frame is larger than the space it gets.
   */
  readonly Canvas: Component;
  /** The hidden copy of the frame that export and copy capture. Set once Canvas mounts. */
  readonly exportRef: Accessor<HTMLElement | undefined>;
  /**
   * Export: the button exports at once with the export settings; the way to
   * choose a one-off export depends on the prototype variant. It binds Ctrl+S.
   */
  readonly ExportButton: Component;
  /** What the Export control runs, for the command menu and the canvas toolbar. */
  readonly exporter: Exporter;
  /** The mini editor that today's theme cards show, drawn in the given theme. */
  readonly ThemePreview: Component<{theme: ThemeEntry}>;
  /** Randomize stays in the command menu and its shortcut, with no button. */
  readonly randomize: () => void;
  readonly format: () => Promise<unknown>;
  readonly canFormat: Accessor<boolean>;
}

const previewCode =
  '// Just a code example \n' +
  'function Preview() {\n' +
  ' const [count, setCount] = \n' +
  '   createSignal(0);\n' +
  '}';

function ThemePreview(props: {theme: ThemeEntry}) {
  const terminal = getTerminalState();
  return (
    <Suspense fallback={<ThemeBoxSkeleton />}>
      <TerminalHost
        themeClass={themeBoxTerminalHost}
        textColor={props.theme.colors.text}
        background={props.theme.colors.window}
        borderType={terminal.state.borderType}
        accentVisible={false}
        shadow={TERMINAL_SHADOWS.bottom}
        showTab={false}
        readonlyTab={true}
        showHeader={false}
        showWatermark={false}
        showGlassReflection={terminal.state.showGlassReflection}
        opacity={100}
        themeId={props.theme.id}
        alternativeTheme={terminal.state.alternativeTheme}
      >
        <CustomEditorPreview
          themeId={props.theme.id}
          languageId={'typescript'}
          code={previewCode}
        />
      </TerminalHost>
    </Suspense>
  );
}

/**
 * The frame's skeleton at the size of the frame that replaces it. The export
 * copy is a static render of the same frame and is ready before the editor,
 * so its box is the frame's. Inside FitFrame it is centred and zoomed as the
 * frame will be. It stays hidden until that box is known and has held for
 * a frame: the copy grows once while its code view finishes rendering.
 */
function FramePlaceholder(props: {frame: Accessor<HTMLElement | undefined>}) {
  const [size, setSize] = createSignal<{width: number; height: number}>();
  const [settled, setSettled] = createSignal(false);
  createEffect(() => {
    const element = props.frame();
    if (!element) return;
    let frame = 0;
    let fontsReady = false;
    const measure = () => {
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) return;
      setSize({width: box.width, height: box.height});
      setSettled(false);
      cancelAnimationFrame(frame);
      if (fontsReady) frame = requestAnimationFrame(() => setSettled(true));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    let disposed = false;
    void document.fonts.ready.then(() => {
      if (disposed) return;
      fontsReady = true;
      measure();
    });
    onCleanup(() => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
    });
  });
  return (
    <div
      class={placeholderStyles.placeholder}
      data-frame-placeholder
      aria-hidden="true"
      style={{
        width: `${size()?.width ?? 0}px`,
        height: `${size()?.height ?? 0}px`,
        opacity: settled() ? 1 : 0,
      }}
    >
      <FrameSkeleton />
    </div>
  );
}

export function createStage(pageState: Accessor<EditorPageState>): Stage {
  const media = matchMedia('(max-width: 768px)');
  const [compact, setCompact] = createSignal(media.matches);
  const updateCompact = () => setCompact(media.matches);
  media.addEventListener('change', updateCompact);
  onCleanup(() => media.removeEventListener('change', updateCompact));
  const [exportRef, setExportRef] = createSignal<HTMLElement>();
  const frame = getFrameState();
  // The scale is not saved, but its command makes the store save everything
  // the canvas shows, a preview included. Production sets it only on phones.
  const setScale = (scale: number) =>
    untrackCommand(() => frame.setScale(scale), false);
  const activeEditor = getActiveEditorStore();
  const exporter = createExporter(exportRef, pageState);
  // As today, a phone gets the smaller buttons.
  const size = useModality() === 'full' ? 'sm' : 'xs';

  return {
    compact,
    Canvas: () => {
      let canvas: HTMLDivElement | undefined;
      onMount(() => getExportCanvasStore().initCanvas(exportRef));
      const [fontsReady] = createResource(exportRef, element => {
        // Layout starts loading the preview's code font before awaiting it.
        element.getBoundingClientRect();
        return document.fonts.ready.then(() => true);
      });
      // Every placeholder sits inside FitFrame, where the frame will be. The
      // export copy renders into a portal, so its place in the tree is free.
      return (
        <div ref={canvas} class={shortcutStyles.canvas}>
          <FitFrame
            onScaleChange={setScale}
            overlay={<ReadOnlyNotice state={pageState()} />}
          >
            <SuspenseEditorItem
              fallback={<FramePlaceholder frame={exportRef} />}
            >
              <Suspense fallback={<FramePlaceholder frame={exportRef} />}>
                <Show when={fontsReady()}>
                  <ManagedFrame />
                </Show>
              </Suspense>
            </SuspenseEditorItem>
            <PreviewFrame ref={setExportRef} />
          </FitFrame>
          <Show when={!compact() && pageState().kind !== 'read-only'}>
            <ShortcutHelp
              canvas={() => canvas}
              editable={pageState().editable}
            />
          </Show>
        </div>
      );
    },
    exportRef,
    ExportButton: () => (
      <ExportControl
        exporter={exporter}
        exportRef={exportRef}
        size={size}
        compact={compact()}
      />
    ),
    exporter,
    ThemePreview,
    randomize: () => dispatchRandomTheme(),
    format: () => activeEditor.format(),
    canFormat: activeEditor.canFormat,
  };
}
