import styles from './App.module.css';
import {Terminal} from './components/Terminal/Terminal';
import {CodeMirror} from './components/CodeMirror';
import {Frame} from './components/Frame/Frame';

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
