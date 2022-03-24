import {createMemo, For, JSXElement, Show} from 'solid-js';
import {InlineTextField} from '../ui/TextField/InlineTextField';
import {Box} from '../ui/Box/Box';
import * as styles from './terminal.css';
import {appEnvironment} from '../../core/configuration';
import {TabIcon} from './TabIcon';
import {highlight as _highlight} from '../../core/directives/highlight';

interface TabNameProps {
  readonly: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const highlight = _highlight;

export function TabName(props: TabNameProps): JSXElement {
  const safeValue = createMemo(() => props.value || '');

  const lastIsDot = createMemo(() => {
    return true;
    return safeValue().includes('.');
  });

  function onChange(value: string): void {
    if (props.onValueChange) {
      props.onValueChange(value);
    }
  }

  const icons = appEnvironment.languages.flatMap(language => language.icons);

  return (
    <>
      <InlineTextField
        size={'sm'}
        readOnly={props.readonly}
        placeholder={'Untitled'}
        value={props.value}
        disabled={false}
        onChange={onChange}
      />
      <Show when={lastIsDot()}>
        <Box class={styles.tabHint}>
          <Box class={styles.tabHintDropdown}>
            <For each={icons}>
              {icon => (
                <Box class={styles.tabHintDropdownItem}>
                  <TabIcon delay={0} content={icon.content} />
                  <div use:highlight={props.value}>.{icon.name}</div>
                </Box>
              )}
            </For>
          </Box>
        </Box>
      </Show>
    </>
  );
}
