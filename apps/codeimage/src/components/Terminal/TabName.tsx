import {createMemo, For, JSXElement, Show} from 'solid-js';
import {InlineTextField} from '../ui/TextField/InlineTextField';
import {Box} from '../ui/Box/Box';
import * as styles from './terminal.css';
import {appEnvironment} from '../../core/configuration';
import {TabIcon} from './TabIcon';
import {highlight as _highlight} from '../../core/directives/highlight';
import {Listbox, ListboxOption, ListboxOptions} from 'solid-headless';
import {tabHintDropdownOption} from './terminal.css';

interface TabNameProps {
  readonly: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

const highlight = _highlight;

export function TabName(props: TabNameProps): JSXElement {
  const hasDot = /^[a-zA-Z0-9]{2,}\./;

  const showHint = createMemo(() => {
    return hasDot.test(props.value ?? '');
  });

  function onChange(value: string): void {
    if (props.onValueChange) {
      props.onValueChange(value);
    }
  }

  const icons = appEnvironment.languages.flatMap(language => language.icons);

  const extension = createMemo(() => {
    if (!props.value) return '';
    const extension = /\.[0-9a-z]+$/i.exec(props.value);
    return (extension ? extension[0] : '').replace('.', '');
  });

  const matchedIcons = createMemo(() => {
    if (!props.value) {
      return icons;
    }

    const currentExtension = extension();

    return icons.filter(icon => icon.extension.includes(currentExtension));
  });

  return (
    <Listbox
      multiple={false}
      onSelectChange={value => props.onValueChange?.(`${props.value}${value}`)}
    >
      <InlineTextField
        size={'sm'}
        readOnly={props.readonly}
        placeholder={'Untitled'}
        value={props.value}
        disabled={false}
        onChange={onChange}
      />
      <Show when={showHint()}>
        <Box class={styles.tabHint}>
          <ListboxOptions class={styles.tabHintDropdownOption}>
            <For each={matchedIcons()}>
              {icon => (
                <ListboxOption
                  value={icon.extension.replace('.', '')}
                  class={styles.tabHintDropdownOption}
                >
                  {({isActive, isSelected}) => (
                    <Box
                      class={styles.tabHintDropdownItemContent({
                        active: isActive() || isSelected(),
                      })}
                    >
                      <TabIcon delay={0} content={icon.content} />
                      <div use:highlight={extension()}>{icon.extension}</div>
                    </Box>
                  )}
                </ListboxOption>
              )}
            </For>
          </ListboxOptions>
        </Box>
      </Show>
    </Listbox>
  );
}
