import {Terminal} from './components/Terminal/Terminal';
import {Frame} from './components/Frame/Frame';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {rx} from './+state/rx';
import {frameState} from './+state/frame.state';
import {Canvas} from './components/Scaffold/Canvas/Canvas';
import {Sidebar} from './components/Scaffold/Sidebar/Sidebar';
import {Scaffold} from './components/Scaffold/Scaffold';
import {Header} from './components/Scaffold/Header/Header';

const App = () => {
  const state = rx(frameState);

  return (
    <Scaffold>
      <Header />

      <Canvas>
        <Frame padding={state.padding} background={state.background}>
          <Terminal>
            <CustomEditor />
          </Terminal>
        </Frame>
      </Canvas>
      <Sidebar></Sidebar>
    </Scaffold>
  );
};

export default App;
