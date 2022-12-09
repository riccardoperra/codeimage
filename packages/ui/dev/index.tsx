import {render} from 'solid-js/web';
import {Box, CodeImageThemeProvider} from '../src';
import {ButtonDemo} from './demo/Button';
import {SegmentedFieldDemo} from './demo/SegmentedControl';
import {SelectDemo} from './demo/Select';
import {TextFieldDemo} from './demo/TextField';
import './reset.scss';
import './global.css';
import '../src/lib/themes/dark-theme.css';
import '../src/lib/themes/light-theme.css';

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
