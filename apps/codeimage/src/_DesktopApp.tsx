import {createSignal, JSXElement, lazy} from 'solid-js';
import {useFrameState} from './state/frame';
import {useTerminalState} from './state/terminal';
import {FrameHandler} from './components/Frame/FrameHandler';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Frame} from './components/Frame/Frame';
import {DynamicTerminal} from './components/Terminal/dynamic/DynamicTerminal';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {Footer} from './components/Footer/Footer';
import {CustomEditor} from './components/CustomEditor/CustomEditor';

const LazySidebar = lazy(() => import('./components/Scaffold/Sidebar/Sidebar'));

const LazyEditorSidebar = lazy(
  () => import('./components/LeftSidebar/EditorSidebar'),
);

export default function DesktopApp(): JSXElement {
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();
  const [portalHostRef, setPortalHostRef] = createSignal<HTMLElement>();
  const frame = useFrameState();
  const terminal = useTerminalState();

  return (
    <>
      <LazySidebar>
        <LazyEditorSidebar />
      </LazySidebar>

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
            >
              <CustomEditor />
            </DynamicTerminal>
          </Frame>
        </FrameHandler>

        <Footer />
      </Canvas>

      <LazySidebar>
        <ThemeSwitcher orientation={'vertical'} />
      </LazySidebar>
    </>
  );
}
