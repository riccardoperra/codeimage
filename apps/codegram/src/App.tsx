import styles from './App.module.css';
import {Terminal} from './components/Terminal/Terminal';
import {Frame} from './components/Frame/Frame';
import {EditorView} from '@codemirror/view';
import {createSignal} from 'solid-js';
import {CodeMirror} from '@local/solid-codemirror';

const App = () => {
  let editor: HTMLElement;
  const [value, setValue] = createSignal('test');

  const theme = EditorView.theme(
    {
      '&': {
        fontFamily: 'Source Code Pro, monospace',
      },
      '.cm-activeLine': {
        backgroundColor: 'transparent',
        color: 'white',
      },
      '.cm-content': {
        fontFamily: 'Source Code Pro, monospace',
        textAlign: 'left',
      },
      '.cm-gutters': {
        display: 'none',
      },
    },
    {dark: true},
  );

  return (
    <div class={styles.App}>
      <Frame>
        <Terminal>
          <CodeMirror
            value={value()}
            extensions={[theme]}
            editable={true}
            basicSetup={true}
            onChange={setValue}
          />
        </Terminal>
      </Frame>
    </div>
  );
};

export default App;
