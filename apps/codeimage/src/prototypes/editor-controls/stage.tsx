import {getExportCanvasStore} from '@codeimage/store/canvas';
import {getActiveEditorStore} from '@codeimage/store/editor/activeEditor';
import {getFrameState} from '@codeimage/store/editor/frame';
import {getTerminalState} from '@codeimage/store/editor/terminal';
import {dispatchRandomTheme} from '@codeimage/store/effects/onThemeChange';
import {TERMINAL_SHADOWS} from '@core/configuration/shadow';
import type {Accessor, Component} from 'solid-js';
import {createSignal, lazy, onMount, Suspense} from 'solid-js';
import {untrackCommand} from 'statebuilder/commands';
import {FrameSkeleton} from '../../components/Frame/FrameSkeleton';
import {PreviewFrame} from '../../components/Frame/PreviewFrame';
import {SuspenseEditorItem} from '../../components/PropertyEditor/SuspenseEditorItem';
import {TerminalHost} from '../../components/Terminal/TerminalHost';
import {ThemeBoxSkeleton} from '../../components/ThemeSwitcher/ThemeBoxSkeleton';
import {themeBoxTerminalHost} from '../../components/ThemeSwitcher/ThemeSwitcher.css';
import {CopyToClipboardButton} from '../../components/Toolbar/CopyToClipboardButton';
import {ExportButton} from '../../components/Toolbar/ExportButton';
import {FitFrame} from './FitFrame';
import type {ThemeEntry} from './model';

const ManagedFrame = lazy(() =>
  import('../../components/Frame/ManagedFrame').then(m => ({
    default: m.ManagedFrame,
  })),
);

const CustomEditorPreview = lazy(
  () => import('../../components/CustomEditor/CustomEditorPreview'),
);

export interface Stage {
  /**
   * The live frame with the real CodeMirror editor. Render it once; it fills its
   * parent and zooms out when the frame is larger than the space it gets.
   */
  readonly Canvas: Component;
  /** The hidden copy of the frame that export and copy capture. Set once Canvas mounts. */
  readonly exportRef: Accessor<HTMLElement | undefined>;
  /** Production Export button with its dialog and the Ctrl+S shortcut. */
  readonly ExportButton: Component;
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

export function createStage(): Stage {
  const [exportRef, setExportRef] = createSignal<HTMLElement>();
  const frame = getFrameState();
  // The scale is not saved, but its command makes the store save everything
  // the canvas shows, a preview included. Production sets it only on phones.
  const setScale = (scale: number) =>
    untrackCommand(() => frame.setScale(scale), false);
  const activeEditor = getActiveEditorStore();

  return {
    Canvas: () => {
      onMount(() => getExportCanvasStore().initCanvas(exportRef));
      return (
        <SuspenseEditorItem fallback={<FrameSkeleton />}>
          <FitFrame onScaleChange={setScale}>
            <Suspense fallback={<FrameSkeleton />}>
              <ManagedFrame />
            </Suspense>
          </FitFrame>
          <PreviewFrame ref={setExportRef} />
        </SuspenseEditorItem>
      );
    },
    exportRef,
    ExportButton: () => <ExportButton canvasRef={exportRef()} />,
    CopyToClipboardButton: () => (
      <CopyToClipboardButton canvasRef={exportRef()} />
    ),
    ThemePreview,
    randomize: () => dispatchRandomTheme(),
    format: () => activeEditor.format(),
    canFormat: activeEditor.canFormat,
  };
}
