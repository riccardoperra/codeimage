import {For} from 'solid-js';
import {Terminal} from '../Terminal/Terminal';
import {Text} from '../ui/Text/Text';
import {sprinkles} from '../../theme/sprinkles.css';

export const ThemeSwitcher = () => {
  const fakeThemes = Array(20).fill(undefined);

  return (
    <div
      style={{
        display: 'grid',
        'flex-direction': 'column',
        'row-gap': '40px',
        'flex-wrap': 'nowrap',
        padding: '16px',
        'overflow-y': 'scroll',
        height: '100%',
      }}
    >
      <For each={fakeThemes}>
        {() => (
          <div style={{display: 'flex', 'flex-direction': 'column'}}>
            <div
              style={{
                'background-color': 'black',
                width: '100%',
                height: '180px',
                display: 'flex',
                'align-items': 'center',
                'justify-content': 'center',
                padding: '16px',
                'border-radius': '1.5rem',
              }}
            >
              <Terminal>
                <Text size={'sm'}>{`console.log('Hello!');`}</Text>
              </Terminal>
            </div>
            <Text
              class={sprinkles({marginTop: '2', textAlign: 'center'})}
              size={'sm'}
            >
              One dark theme
            </Text>
          </div>
        )}
      </For>
    </div>
  );
};
