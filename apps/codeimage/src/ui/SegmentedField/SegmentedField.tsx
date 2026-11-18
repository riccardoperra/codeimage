import * as styles from '@codeui/kit/segmented-styles';
import {type JSX} from '@solidjs/web';
import clsx from 'clsx';
import {
  createEffect,
  createSignal,
  For,
  type Element as JSXElement,
} from 'solid-js';

export interface SegmentedFieldItem<T> {
  label: string | JSXElement;
  value: T;
}

interface SegmentedFieldProps<T> {
  items: readonly SegmentedFieldItem<T>[];
  itemClass?: string;
  value: T;
  onChange?: (value: T) => void;
  onEscape?: () => void;
  size?: NonNullable<
    Parameters<typeof styles.segmentedControlWrapper>[0]
  >['size'];
  id?: string;
  adapt?: boolean;
  autoWidth?: boolean;
}

export function SegmentedField<T>(props: SegmentedFieldProps<T>): JSX.Element {
  const [list, setList] = createSignal<HTMLDivElement>();
  const [position, setPosition] = createSignal({width: 0, offset: 0});
  const selected = () =>
    Math.max(
      0,
      props.items.findIndex(item => item.value === props.value),
    );
  const tabs = () =>
    Array.from(
      list()?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
    );
  createEffect(
    () => [selected(), list()] as const,
    ([index, element]) => {
      if (!element) return;
      const button =
        element.querySelectorAll<HTMLButtonElement>('[role="tab"]')[index];
      const resize = () => {
        if (button)
          setPosition({width: button.clientWidth, offset: button.offsetLeft});
      };
      resize();
      const observer = new ResizeObserver(resize);
      observer.observe(element);
      if (button) observer.observe(button);
      return () => observer.disconnect();
    },
  );
  return (
    <div
      id={props.id}
      data-cui="segmentedControl"
      data-autoWidth={props.adapt || props.autoWidth ? '' : undefined}
      class={styles.segmentedControlWrapper({
        size: props.size ?? 'sm',
        fluid: props.adapt,
        theme: 'neutral',
        variant: 'solid',
      })}
    >
      <div
        role="tablist"
        data-cui="segmentedControlList"
        class={styles.list}
        ref={setList}
        onKeyDown={event => {
          if (event.key === 'Escape' && props.onEscape) {
            event.stopPropagation();
            props.onEscape();
            return;
          }
          const buttons = tabs();
          if (!buttons.length) return;
          const index = buttons.findIndex(button => button === event.target);
          const destinations: Record<string, number> = {
            ArrowLeft: (index + buttons.length - 1) % buttons.length,
            ArrowRight: (index + 1) % buttons.length,
            Home: 0,
            End: buttons.length - 1,
          };
          if (!(event.key in destinations)) return;
          event.preventDefault();
          buttons[destinations[event.key]]?.focus();
        }}
      >
        <For each={props.items}>
          {(item, index) => (
            <button
              type="button"
              role="tab"
              aria-selected={index() === selected() ? 'true' : 'false'}
              data-cui="segmentedControlItem"
              data-selected={index() === selected() ? '' : undefined}
              class={clsx(styles.segment, props.itemClass)}
              tabindex={index() === selected() ? 0 : -1}
              onClick={() => props.onChange?.(item.value)}
            >
              {item.label}
            </button>
          )}
        </For>
        <span
          aria-hidden="true"
          data-cui="segmentedControlIndicator"
          class={styles.indicator}
          style={{
            width: `${position().width}px`,
            transform: `translateX(${position().offset}px)`,
          }}
        />
      </div>
    </div>
  );
}
