import {render} from 'solid-js/web';
import {Box, CodeImageThemeProvider} from '../src';
import {ButtonDemo} from './demo/Button';
import './reset.scss';
import './dark-theme.css';
import './global.css';
import {SegmentedFieldDemo} from './demo/SegmentedControl';
import {TextFieldDemo} from './demo/TextField';

function App() {
  return (
    <CodeImageThemeProvider tokens={{}} theme={'dark'}>
      <Box padding={'6'}>
        <ButtonDemo />

        <Box marginTop={'12'}>
          <TextFieldDemo />
        </Box>

        <Box marginTop={'12'}>
          <SegmentedFieldDemo />
        </Box>
      </Box>
    </CodeImageThemeProvider>
  );
}

render(() => <App />, document.getElementById('root') as HTMLDivElement);
