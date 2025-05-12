import {type LanguageIconDefinition} from '@codeimage/config';
import {exportExclude} from '@core/directives/exportExclude';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {createSortable} from '@thisbeyond/solid-dnd';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {
  createMemo,
  createSignal,
  lazy,
  onMount,
  Show,
  Suspense,
  type VoidProps,
} from 'solid-js';
import {CloseIcon} from '../../../Icons/CloseIcon';
import * as styles from './Tab.css';
import {WindowTab, WindowTabContentText} from './WindowTab';

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

const TabName = lazy(() => import('../TabName/TabName'));

export function DraggableWindowTab(props: VoidProps<WindowTabProps>) {
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
    <WindowTab
      ref={el => {
        ref = el;
        sortable(ref);
        exportExclude(el, () => props.exportExclude);
      }}
      id={props.id}
      index={props.index}
      active={props.active}
      accentMode={props.accentMode}
      tabIcon={props.tabIcon}
      data-active-drag={sortable.isActiveDraggable}
      data-host-index={props.index}
      style={assignInlineVars({
        [styles.tabVars.tabIndex]: String(props.index),
      })}
      onMouseDown={() => props.onClick?.()}
      content={
        <Show
          fallback={
            <WindowTabContentText>{props.tabName}</WindowTabContentText>
          }
          when={!props.readonlyTab}
        >
          <Suspense>
            <TabName
              readonly={props.readonlyTab && !props.active}
              value={props.tabName ?? ''}
              onValueChange={value => props.onTabChange?.(value)}
            />
          </Suspense>
        </Show>
      }
      rightContent={
        <Show when={props.onClose && hasEnoughSpace()}>
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
        </Show>
      }
    />
  );
}
