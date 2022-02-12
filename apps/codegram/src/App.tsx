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

const App = () => {
  const state = from(frameState);
  const [frameRef, setFrameRef] = createSignal<HTMLElement>();

  return (
    <Scaffold>
      <Sidebar>
        <FrameSidebar />
      </Sidebar>

      <Canvas>
        <Toolbar canvasRef={frameRef()} />

        <div ref={setFrameRef}>
          <Frame padding={state().padding} background={state().background}>
            <Terminal>
              <CustomEditor />
            </Terminal>
          </Frame>
        </div>
      </Canvas>
    </Scaffold>
  );
};

export default App;
