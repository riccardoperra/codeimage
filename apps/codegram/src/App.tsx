import {Terminal} from './components/Terminal/Terminal';
import {Frame} from './components/Frame/Frame';
import {frameState} from './state/frame.state';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {FrameSidebar} from './components/LeftSidebar/LeftSidebar';
import {createSignal, from} from 'solid-js';
import {ThemeSwitcher} from './components/ThemeSwitcher/ThemeSwitcher';

const App = () => {
  const state = from(frameState);
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
            padding={state().padding}
            radius={state().radius}
            background={state().background}
          >
            <Terminal {...state()}>
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
