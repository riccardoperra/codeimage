import styles from './App.module.css';
import Frame from './components/Frame/Frame';
import {setup} from 'solid-styled-components';
import {prefix} from 'goober/prefixer';
import {Terminal} from './components/Terminal/Terminal';
import {CodeMirror} from './components/CodeMirror';

setup(prefix);

const App = () => {
  return (
    <div class={styles.App}>
      <Frame>
        <Terminal>
          <CodeMirror />
        </Terminal>
      </Frame>
    </div>
  );
};

export default App;
