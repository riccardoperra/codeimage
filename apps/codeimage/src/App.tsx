import {useI18n} from '@codeimage/locale';
import {getActiveEditorStore} from '@codeimage/store/editor/createActiveEditor';
import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {copyToClipboard$} from '@codeimage/store/effects/onCopyToClipboard';
import {onThemeChange$} from '@codeimage/store/effects/onThemeChange';
import {frame$, setScale} from '@codeimage/store/frame';
import {terminal$} from '@codeimage/store/terminal';
import {Box, LoadingOverlay, PortalHost, SnackbarHost} from '@codeimage/ui';
import {fromObservableObject} from '@core/hooks/from-observable-object';
import {useModality} from '@core/hooks/isMobile';
import {useEffects} from '@core/store/use-effect';
import {initEffects} from '@ngneat/effects';
import {createEffect, createSignal, lazy, on, Show} from 'solid-js';
import {BottomBar} from './components/BottomBar/BottomBar';
import CustomEditor from './components/CustomEditor/CustomEditor';
import {Footer} from './components/Footer/Footer';
import {Frame} from './components/Frame/Frame';
import {FrameHandler} from './components/Frame/FrameHandler';
import {KeyboardShortcuts} from './components/KeyboardShortcuts/KeyboardShortcuts';
import {EditorSidebar} from './components/PropertyEditor/EditorSidebar';
import {SidebarPopoverHost} from './components/PropertyEditor/SidebarPopoverHost';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {DynamicTerminal} from './components/Terminal/DynamicTerminal/DynamicTerminal';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {Toolbar} from './components/Toolbar/Toolbar';
import {uiStore} from './state/ui';
import './theme/global.css';

initEffects();

export function App() {
  document.querySelector('#launcher')?.remove();
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const frame = fromObservableObject(frame$);
  const terminal = fromObservableObject(terminal$);
  const modality = useModality();
  const editor = getRootEditorStore();
  const [, {locale}] = useI18n();
  // TODO: currently disabled
  // connectStoreWithQueryParams();
  useEffects([onThemeChange$, copyToClipboard$]);
  createEffect(on(() => uiStore.locale, locale));
  const {ready} = getRootEditorStore();

  return (
    <Scaffold>
      <PortalHost id={'floating-portal-popover'} />
      <SidebarPopoverHost />
      <SnackbarHost />

      <Show when={modality === 'full'}>
        <Sidebar position={'left'}>
          <EditorSidebar />
        </Sidebar>
      </Show>

      <PortalHost ref={setPortalHostRef} />

      <Canvas>
        <Toolbar canvasRef={frameRef()} />
        <Show when={modality === 'full'}>
          <Box paddingLeft={4} paddingTop={3}>
            <KeyboardShortcuts />
          </Box>
        </Show>

        <FrameHandler ref={setFrameRef} onScaleChange={setScale}>
          <Show
            when={ready()}
            fallback={
              <div style={{height: '400px', width: '600px'}}>
                <LoadingOverlay overlay={true} size={'lg'} />
              </div>
            }
          >
            <Frame
              radius={0}
              padding={frame.padding}
              background={frame.background}
              opacity={frame.opacity}
              visible={frame.visible}
            >
              <DynamicTerminal
                type={terminal.type}
                readonlyTab={false}
                tabName={terminal.tabName}
                showTab={true}
                shadow={terminal.shadow}
                background={terminal.background}
                accentVisible={terminal.accentVisible}
                darkMode={terminal.darkMode}
                textColor={terminal.textColor}
                showHeader={terminal.showHeader}
                showGlassReflection={terminal.showGlassReflection}
                showWatermark={terminal.showWatermark}
                opacity={terminal.opacity}
                alternativeTheme={terminal.alternativeTheme}
                themeId={editor.options.themeId}
              >
                <Show when={getActiveEditorStore().editor()}>
                  <CustomEditor />
                </Show>
              </DynamicTerminal>
            </Frame>
          </Show>
        </FrameHandler>

        <Footer />
      </Canvas>

      <Show
        when={modality === 'full'}
        fallback={<BottomBar portalHostRef={portalHostRef()} />}
      >
        <Sidebar position={'right'}>
          <ThemeSwitcher orientation={'vertical'} />
        </Sidebar>
      </Show>
    </Scaffold>
  );
}

export default App;
