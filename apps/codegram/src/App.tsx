import {Terminal} from './components/Terminal/Terminal';
import {Frame} from './components/Frame/Frame';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {FrameSidebar} from './components/LeftSidebar/LeftSidebar';
import {createSignal} from 'solid-js';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';
import {useFrameState} from './state/frame';
import {useTerminalState} from './state/terminal';

const App = () => {
  const frame = useFrameState();
  const terminal = useTerminalState();
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();

  return (
    <Scaffold>
      <Sidebar>
        <FrameSidebar />
      </Sidebar>

      <div
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

        <div ref={setFrameRef}>
          <Frame
            radius={0}
            padding={frame.padding}
            background={frame.background}
            opacity={frame.opacity}
            visible={frame.visible}
          >
            <Terminal
              tabName={terminal.tabName}
              shadow={terminal.shadow}
              background={terminal.background}
              accentVisible={terminal.accentVisible}
              darkMode={terminal.darkMode}
              textColor={terminal.textColor}
              onTabChange={terminal.setTabName}
            >
              <CustomEditor />
            </Terminal>
          </Frame>
        </div>
      </Canvas>

      <Sidebar>
        <ThemeSwitcher />
      </Sidebar>
    </Scaffold>
  );
};

export default App;
