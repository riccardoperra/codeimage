import {LanguageIconDefinition} from '@codeimage/config';
import {Loading, Text} from '@codeimage/ui';
import {exportExclude as _exportExclude} from '@core/directives/exportExclude';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {createSortable} from '@thisbeyond/solid-dnd';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createMemo,
  createSignal,
  onMount,
  Show,
  Suspense,
  VoidProps,
} from 'solid-js';
import {CloseIcon} from '../../../Icons/CloseIcon';
import {TabIcon} from '../TabIcon/TabIcon';
import {TabName} from '../TabName/TabName';
import * as styles from './Tab.css';

const exportExclude = _exportExclude;

export interface WindowTabProps {
  readonly id: string;
  readonly index: number;
  readonly tabName?: string | null;
  readonly tabIcon?: LanguageIconDefinition['content'];
  readonly readonlyTab: boolean;
  readonly accentMode: boolean;
  readonly active: boolean;
  readonly onTabChange: (value: string) => void;
  readonly exportExclude: boolean;
  readonly onClick?: () => void;
  readonly onClose?: (() => void) | null;
}

export function WindowTab(props: VoidProps<WindowTabProps>) {
  let ref!: HTMLDivElement;
  const [width, setWidth] = createSignal<number>(0);
  // eslint-disable-next-line solid/reactivity
  const sortable = createSortable(props.id);

  onMount(() => {
    createResizeObserver(
      () => ref,
      ({width}) => setWidth(width),
    );
  });

  const hasEnoughSpace = createMemo(() => width() >= 32);

  return (
    <div
      use:exportExclude={props.exportExclude}
      class={styles.tab({
        accent: props.accentMode,
        active: props.active,
      })}
      ref={el => {
        ref = el;
        sortable(ref);
      }}
      data-active-drag={sortable.isActiveDraggable}
      data-host-index={props.index}
      data-accent-visible={props.accentMode}
      style={assignInlineVars({
        [styles.tabVars.tabIndex]: String(props.index),
      })}
      data-active={props.active}
      onMouseDown={() => props.onClick?.()}
    >
      <Suspense fallback={<Loading size={'sm'} />}>
        <Show when={props.tabIcon} keyed>
          {icon => <TabIcon content={icon} />}
        </Show>
        <div class={styles.tabTextContent}>
          <Show
            fallback={
              <Text size={'sm'} class={styles.fallbackText}>
                {props.tabName || 'Untitled'}
              </Text>
            }
            when={!props.readonlyTab}
          >
            <TabName
              readonly={props.readonlyTab && !props.active}
              value={props.tabName ?? ''}
              onValueChange={value => props.onTabChange?.(value)}
            />
          </Show>
        </div>
      </Suspense>

      <Show when={props.onClose && hasEnoughSpace()}>
        {() => (
          <CloseIcon
            class={styles.tabCloseIcon}
            onClick={evt => {
              props.onClose?.();
              evt.stopPropagation();
              evt.preventDefault();
            }}
            size={'xs'}
            stroke-width={3}
            data-export-exclude={true}
          />
        )}
      </Show>
    </div>
  );
}
