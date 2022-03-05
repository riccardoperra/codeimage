import {Frame} from './components/Frame/Frame';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {createEffect, createMemo, createSignal, on, Show} from 'solid-js';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {useFrameState} from './state/frame';
import {useTerminalState} from './state/terminal';
import {DynamicTerminal} from './components/Terminal/dynamic/DynamicTerminal';
import {Footer} from './components/Footer/Footer';
import {useUIState} from './state/ui';
import {lightThemeCss} from './theme/light-theme.css';
import {darkThemeCss} from './theme/dark-theme.css';
import {useI18n} from '@codeimage/locale';
import {useModality} from './core/hooks/isMobile';
import {BottomBar} from './components/BottomBar/BottomBar';
import {FrameHandler} from './components/Frame/FrameHandler';
import {EditorSidebar} from './components/LeftSidebar/EditorSidebar';

const App = () => {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const frame = useFrameState();
  const terminal = useTerminalState();
  const ui = useUIState();
  const modality = useModality();
  const [, {locale}] = useI18n();
  const currentLocale = createMemo(() => ui.locale);

  createEffect(on(currentLocale, locale));

  return (
    <Scaffold theme={ui.themeMode === 'light' ? lightThemeCss : darkThemeCss}>
      <Show when={modality === 'full'}>
        <Sidebar>
          <EditorSidebar />
        </Sidebar>
      </Show>

      <div
        ref={setPortalHostRef}
        id={'portal-host'}
        style={{
          position: 'relative',
          width: '0px',
          height: '0px',
          // eslint-disable-next-line solid/style-prop
          'z-index': 10,
        }}
      />

      <Canvas>
        <Toolbar canvasRef={frameRef()} />

        <FrameHandler ref={setFrameRef}>
          <Frame
            radius={0}
            padding={frame.padding}
            background={frame.background}
            opacity={frame.opacity}
            visible={frame.visible}
          >
            <DynamicTerminal
              type={terminal.type}
              tabName={terminal.tabName}
              shadow={terminal.shadow}
              background={terminal.background}
              accentVisible={terminal.accentVisible}
              darkMode={terminal.darkMode}
              textColor={terminal.textColor}
              onTabChange={terminal.setTabName}
              showTab={true}
              showHeader={terminal.showHeader}
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
