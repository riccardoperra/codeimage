import {render} from 'solid-js/web';
import {Box, CodeImageThemeProvider} from '../src';
import './dark-theme.css';
import {ButtonDemo} from './demo/Button';
import {SegmentedFieldDemo} from './demo/SegmentedControl';
import {SelectDemo} from './demo/Select';
import {TextFieldDemo} from './demo/TextField';
import './global.css';
import './reset.scss';

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

        <Box marginTop={'12'}>
          <SelectDemo />
        </Box>
      </Box>
    </CodeImageThemeProvider>
  );
}

render(() => <App />, document.getElementById('root') as HTMLDivElement);
