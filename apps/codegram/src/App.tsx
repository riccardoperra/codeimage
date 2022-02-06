import styles from './App.module.css';
import {Terminal} from './components/Terminal/Terminal';
import {Frame} from './components/Frame/Frame';
import {CustomEditor} from './components/CustomEditor/CustomEditor';

const App = () => {
  return (
    <div class={styles.App}>
      <Frame>
        <Terminal>
          <CustomEditor />
        </Terminal>
      </Frame>
    </div>
  );
};

export default App;
