import styles from './App.module.css';
import {Terminal} from './components/Terminal/Terminal';
import {Frame} from './components/Frame/Frame';
import {CustomEditor} from './components/CustomEditor/CustomEditor';
import {Toolbar} from './components/Toolbar/Toolbar';
import {rx} from './+state/rx';
import {frameState} from './+state/frame.state';

const App = () => {
  const state = rx(frameState);

  return (
    <div class={styles.App}>
      <Toolbar />

      <div
        style={{
          flex: '1',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          margin: '30px 0',
        }}
      >
        <Frame padding={state.padding} background={state.background}>
          <Terminal>
            <CustomEditor />
          </Terminal>
        </Frame>
      </div>
    </div>
  );
};

export default App;
