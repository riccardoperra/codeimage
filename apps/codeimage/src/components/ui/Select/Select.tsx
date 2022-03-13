import {
  HeadlessDisclosureChild,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  ListboxProps,
} from 'solid-headless';
import {Component, For, JSX, JSXElement, Show} from 'solid-js';
import * as styles from './Select.css';
import {Box} from '../Box/Box';
import Fragment from 'solid-headless/src/utils/Fragment';
import {Text} from '../Text/Text';
import {useFloating} from '../../../core/floating-ui/floating-ui';
import {flip, offset} from '@floating-ui/dom';

function SelectorIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2"
        d="M8 9l4-4 4 4m0 6l-4 4-4-4"
      />
    </svg>
  );
}

interface SelectOptions<T> {
  label: string;
  value: T;
}

type SelectProps<T> = ListboxProps<T, typeof Fragment> & {
  items: SelectOptions<T>[];
  itemContent?: Component<SelectOptions<T> & {selected: boolean}>;
  native?: boolean;
};

export function Select<T>(props: SelectProps<T>): JSXElement {
  const floating = useFloating({
    strategy: 'absolute',
    middleware: [offset(4), flip()],
  });

  const label = () => {
    // TODO: multiple select needed?
    return (
      props.items.find(item => item.value === props.value)?.label ??
      'No items selected'
    );
  };

  return (
    <Listbox
      value={props.value}
      onSelectChange={value => props?.onSelectChange?.(value as T[] & T)}
    >
      <Box class={styles.wrapper} ref={floating.setReference}>
        <Show when={props.native}>
          <select
            class={styles.native}
            onChange={event => {
              if ('value' in event.target) {
                const value = event.target['value'] as unknown as T;
                props?.onSelectChange?.(value as T[] & T);
              }
            }}
          >
            <For each={props.items}>
              {item => (
                <option
                  value={item.value as unknown as string}
                  class={styles.listBoxOption({active: false})}
                >
                  {item.label}
                </option>
              )}
            </For>
          </select>
        </Show>
        <ListboxButton
          class={styles.listBox}
          onClick={(e: MouseEvent) => {
            if (props.native) {
              e.preventDefault();
            }
          }}
        >
          <span class={styles.selected}>{label()}</span>
          <span class={styles.selectorIconWrapper}>
            <SelectorIcon class={styles.selectorIcon} aria-hidden="true" />
          </span>
        </ListboxButton>
        <HeadlessDisclosureChild>
          {({isOpen}) => (
            <Show when={isOpen()}>
              <ListboxOptions
                ref={floating.setFloating}
                style={{
                  left: `${floating.x}px`,
                  top: `${floating.y}px`,
                  position: floating.strategy,
                }}
                class={styles.listBoxPanel}
              >
                <For each={props.items}>
                  {item => (
                    <ListboxOption
                      class={styles.listBoxOptionWrapper}
                      value={item.value}
                    >
                      {({isActive, isSelected}) => (
                        <div
                          class={styles.listBoxOption({
                            active: isActive(),
                          })}
                        >
                          {props.itemContent ? (
                            <props.itemContent
                              label={item.label}
                              value={item.value}
                              selected={isSelected()}
                            />
                          ) : (
                            <Text
                              size={'xs'}
                              display={'block'}
                              weight={isSelected() ? 'medium' : 'normal'}
                            >
                              {item.label}
                            </Text>
                          )}
                        </div>
                      )}
                    </ListboxOption>
                  )}
                </For>
              </ListboxOptions>
            </Show>
          )}
        </HeadlessDisclosureChild>
      </Box>
    </Listbox>
  );
}
