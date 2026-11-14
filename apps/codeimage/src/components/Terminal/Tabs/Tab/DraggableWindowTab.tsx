import type {LanguageIconDefinition} from '@codeimage/config';
import {exportExclude} from '@core/directives/exportExclude';
import {createResizeObserver} from '@solid-primitives/resize-observer';
import {createSortable} from '@thisbeyond/solid-dnd';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {VoidProps} from 'solid-js';
import {
  createMemo,
  createSignal,
  lazy,
  onMount,
  Show,
  Suspense,
} from 'solid-js';
import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../../../i18n';
import type {WindowStyle} from '../../WindowStyles/WindowStyles';
import * as modern from './WindowTabStyle.css';
import {CloseIcon} from '../../../Icons/CloseIcon';
import * as styles from './Tab.css';
import {WindowTab, WindowTabContentText} from './WindowTab';

export interface WindowTabProps {
  readonly appearance?: WindowStyle;
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
  const [t] = useI18n<AppLocaleEntries>();
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
      appearance={props.appearance}
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
            <Show
              when={props.appearance}
              fallback={
                <WindowTabContentText>{props.tabName}</WindowTabContentText>
              }
            >
              <span>{props.tabName}</span>
            </Show>
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
          <Show
            when={props.appearance}
            fallback={
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
            }
          >
            <button
              class={modern.close}
              aria-label={t('frame.closeTab')}
              onPointerDown={event => event.stopPropagation()}
              onMouseDown={event => event.stopPropagation()}
              data-export-exclude={true}
              onClick={event => {
                props.onClose?.();
                event.stopPropagation();
                event.preventDefault();
              }}
            >
              ×
            </button>
          </Show>
        </Show>
      }
    />
  );
}
