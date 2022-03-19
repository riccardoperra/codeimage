import {For, JSXElement} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {terminal$} from '@codeimage/store/terminal';
import {Group} from '../ui/Group/Group';
import {RadioBlock} from '../ui/RadioBlock/RadioBlock';
import {Box} from '../ui/Box/Box';
import {EnvironmentProvider} from '../../core/configuration';
import {fromObservableObject} from '../../core/hooks/from-observable-object';
import {inject} from 'solid-use';

interface TerminalControlFieldProps {
  selectedTerminal: string;
  onTerminalChange: (type: string) => void;
}

export function TerminalControlField(
  props: TerminalControlFieldProps,
): JSXElement {
  // TODO: add lazy loading?
  const {terminalThemes} = inject(EnvironmentProvider);
  const terminalState = fromObservableObject(terminal$);

  return (
    <Group orientation={'vertical'}>
      <For each={Object.values(terminalThemes.entries)}>
        {terminal => (
          <RadioBlock
            selected={terminal.name === props.selectedTerminal}
            value={terminal.name}
            onSelect={props.onTerminalChange}
          >
            <Box padding={'2'} width={'100%'}>
              <Dynamic
                showTab={false}
                shadow={'none'}
                tabName={'Untitled'}
                component={terminal.component}
                textColor={terminalState.textColor}
                background={terminalState.background}
                darkMode={terminalState.darkMode}
                accentVisible={true}
                readonlyTab={true}
                showHeader={true}
                showWatermark={false}
              />
            </Box>
          </RadioBlock>
        )}
      </For>
    </Group>
  );
}
