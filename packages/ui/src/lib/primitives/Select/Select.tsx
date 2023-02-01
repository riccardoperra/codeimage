import {flip, offset} from '@floating-ui/dom';
import {
  HeadlessDisclosureChild,
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  ListboxProps,
} from 'solid-headless';
import {Component, For, JSX, JSXElement, Show} from 'solid-js';
import {useFloating} from '../../hooks';
import {Box} from '../Box';
import {Text} from '../Text';
import * as styles from './Select.css';

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

export interface SelectOptions<T> {
  label: string;
  value: T;
}

type SelectProps<T> = Omit<ListboxProps<T>, 'onSelectChange' | 'value'> & {
  items: SelectOptions<T>[];
  itemContent?: Component<SelectOptions<T> & {selected: boolean}>;
  native?: boolean;
  id?: string;
} & (
    | {
        multiple: true;
        value: T[];
        onSelectChange: (value: T[]) => unknown;
      }
    | {
        multiple: false;
        value: T;
        onSelectChange: (value: T) => unknown;
      }
  );

export function Select<T>(props: SelectProps<T>): JSXElement {
  const floating = useFloating({
    strategy: 'absolute',
    middleware: [offset(4), flip()],
  });

  const label = () => {
    return (
      props.items.find(item => item.value === props.value)?.label ??
      'No items selected'
    );
  };

  return (
    <Listbox
      defaultOpen={false}
      value={(props as any).value}
      onSelectChange={(value: any) => props?.onSelectChange?.(value as T[] & T)}
    >
      <Box class={styles.wrapper} ref={floating.setReference} id={props.id}>
        <Show when={props.native}>
          <select
            class={styles.native}
            id={props.id}
            onChange={event => {
              if ('value' in event.target) {
                const index = event.target['value'] as unknown as number;
                const item = props.items[index];
                props?.onSelectChange?.(item.value as T[] & T);
              }
            }}
          >
            <For each={props.items}>
              {(item, index) => (
                <option
                  value={index()}
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
                        <Box
                          as={'div'}
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
                              {...(isSelected() ? {weight: 'medium'} : {})}
                            >
                              {item.label}
                            </Text>
                          )}
                        </Box>
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
