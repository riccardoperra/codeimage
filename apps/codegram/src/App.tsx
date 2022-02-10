import {Terminal} from './components/Terminal/Terminal';
import {Frame} from './components/Frame/Frame';
import {observe} from './+state/observe';
import {frameState} from './+state/frame.state';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Scaffold} from './components/Scaffold/Scaffold';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Toolbar} from './components/Toolbar/Toolbar';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {FrameSidebar} from './components/LeftSidebar/LeftSidebar';

const App = () => {
  const state = observe(frameState);

  return (
    <Scaffold>
      <Sidebar>
        <FrameSidebar />
      </Sidebar>

      <Canvas>
        <Toolbar />

        <Frame padding={state().padding} background={state().background}>
          <Terminal>
            <CustomEditor />
          </Terminal>
        </Frame>
      </Canvas>
    </Scaffold>
  );
};

export default App;
