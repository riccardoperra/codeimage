import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import {useModality} from '@core/hooks/isMobile';
import type {Accessor, Component} from 'solid-js';
import {
  createEffect,
  createSignal,
  lazy,
  onCleanup,
  onMount,
  Suspense,
} from 'solid-js';
import {untrackCommand} from 'statebuilder/commands';
import {FrameSkeleton} from '../../components/Frame/FrameSkeleton';
import {PreviewFrame} from '../../components/Frame/PreviewFrame';
import {SuspenseEditorItem} from '../../components/PropertyEditor/SuspenseEditorItem';
import {TerminalHost} from '../../components/Terminal/TerminalHost';
import {ThemeBoxSkeleton} from '../../components/ThemeSwitcher/ThemeBoxSkeleton';
import {themeBoxTerminalHost} from '../../components/ThemeSwitcher/ThemeSwitcher.css';
import {CopyToClipboardButton} from './localized/CopyToClipboardButton';
import {FitFrame} from './FitFrame';
import * as placeholderStyles from './frame-placeholder.css';
import type {ThemeEntry} from './model';
import type {Exporter} from './shell/export';
import {createExporter} from './shell/export';
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
   * Export: the button exports at once with the export settings, the arrow
   * beside it exports one image per tab or opens the export settings. It
   * binds Ctrl+S.
   */
  readonly ExportButton: Component;
  /** What the Export control runs, for the command menu. */
  readonly exporter: Exporter;
  readonly CopyToClipboardButton: Component;
  /** The mini editor that today's theme cards show, drawn in the given theme. */
  readonly ThemePreview: Component<{theme: ThemeEntry}>;
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
    const measure = () => {
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) return;
      setSize({width: box.width, height: box.height});
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setSettled(true));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    measure();
    onCleanup(() => {
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
        visibility: settled() ? undefined : 'hidden',
      }}
    >
      <FrameSkeleton />
    </div>
  );
}

export function createStage(): Stage {
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
  const exporter = createExporter(exportRef);
  // As today, a phone gets the smaller buttons.
  const size = useModality() === 'full' ? 'sm' : 'xs';

  return {
    compact,
    Canvas: () => {
      onMount(() => getExportCanvasStore().initCanvas(exportRef));
      // Every placeholder sits inside FitFrame, where the frame will be. The
      // export copy renders into a portal, so its place in the tree is free.
      return (
        <FitFrame onScaleChange={setScale}>
          <SuspenseEditorItem fallback={null}>
            <Suspense fallback={<FramePlaceholder frame={exportRef} />}>
              <ManagedFrame />
            </Suspense>
            <PreviewFrame ref={setExportRef} />
          </SuspenseEditorItem>
        </FitFrame>
      );
    },
    exportRef,
    ExportButton: () => <ExportControl exporter={exporter} size={size} />,
    exporter,
    CopyToClipboardButton: () => (
      <CopyToClipboardButton canvasRef={exportRef()} />
    ),
    ThemePreview,
    randomize: () => dispatchRandomTheme(),
    format: () => activeEditor.format(),
    canFormat: activeEditor.canFormat,
  };
}
