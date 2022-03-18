import {Frame} from './components/Frame/Frame';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {
  createEffect,
  createMemo,
  createSignal,
  on,
  onMount,
  Show,
} from 'solid-js';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {useFrameState} from './state/frame';
import {useTerminalState} from './state/terminal';
import {DynamicTerminal} from './components/Terminal/dynamic/DynamicTerminal';
import {Footer} from './components/Footer/Footer';
import {useUIState} from './state/ui';
import {useI18n} from '@codeimage/locale';
import {useModality} from './core/hooks/isMobile';
import {BottomBar} from './components/BottomBar/BottomBar';
import {FrameHandler} from './components/Frame/FrameHandler';
import {EditorSidebar} from './components/LeftSidebar/EditorSidebar';
import {NotificationHandler} from './components/ui/Toast/SnackbarHost';
import ReloadPrompt from './components/PromptUpdate/PromptUpdate';
import {PortalHost} from './components/ui/PortalHost/PortalHost';
import {useTabIcon} from './hooks/use-tab-icon';
import {useStaticConfiguration} from './core/configuration';
import {useEditorState} from './state/editor';

const App = () => {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const configuration = useStaticConfiguration();
  const frame = useFrameState();
  const terminal = useTerminalState();
  const editor = useEditorState();
  const ui = useUIState();
  const modality = useModality();
  const [, {locale}] = useI18n();
  const currentLocale = createMemo(() => ui.locale);
  const [tabIcon] = useTabIcon({withDefault: true});

  createEffect(on(currentLocale, locale));

  return (
    <Scaffold>
      <NotificationHandler />
      <ReloadPrompt />
      <Show when={modality === 'full'}>
        <Sidebar>
          <EditorSidebar />
        </Sidebar>
      </Show>

      <PortalHost ref={setPortalHostRef} />

      <Canvas>
        <Toolbar canvasRef={frameRef()} />

        <FrameHandler ref={setFrameRef} onScaleChange={frame.setScale}>
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
              onTabChange={terminal.setTabName}
              showHeader={terminal.showHeader}
              tabIcon={tabIcon()?.src}
              showWatermark={terminal.showWatermark}
            >
              <CustomEditor />
            </DynamicTerminal>
          </Frame>
        </FrameHandler>

        <Footer />
      </Canvas>

      {modality === 'mobile' ? (
        <BottomBar portalHostRef={portalHostRef()} />
      ) : (
        <Sidebar>
          <ThemeSwitcher orientation={'vertical'} />
        </Sidebar>
      )}
    </Scaffold>
  );
};

export default App;
