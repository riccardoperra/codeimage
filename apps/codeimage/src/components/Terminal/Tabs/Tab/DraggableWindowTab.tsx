import type {LanguageIconDefinition} from '@codeimage/config';
import {registerSortableTab} from '@core/modules/dnd';
import type {DragDropManager} from '@dnd-kit/dom';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import type {VoidProps} from 'solid-js';
import {
  createEffect,
  createMemo,
  createSignal,
  lazy,
  onSettled,
  Show,
  Loading as LoadingBoundary,
  untrack,
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
  readonly sortIndex: number;
  readonly manager?: DragDropManager;
  readonly dragging: boolean;
  readonly dropTarget: boolean;
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

function TabCloseButton(props: {onClose: () => void}) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <button
      class={modern.close}
      aria-label={t('frame.closeTab')}
      onPointerDown={event => event.stopPropagation()}
      onMouseDown={event => event.stopPropagation()}
      data-export-exclude="true"
      onClick={event => {
        props.onClose();
        event.stopPropagation();
        event.preventDefault();
      }}
    >
      ×
    </button>
  );
}

export function DraggableWindowTab(props: VoidProps<WindowTabProps>) {
  const [element, setElement] = createSignal<HTMLDivElement>();
  const [width, setWidth] = createSignal(0);
  let sortable: ReturnType<typeof registerSortableTab> | undefined;

  createEffect(
    () => [props.manager, element(), props.id] as const,
    ([manager, element, id]) => {
      if (!manager || !element) return;
      const registration = registerSortableTab(manager, {
        id,
        element,
        index: untrack(() => props.sortIndex),
      });
      sortable = registration;
      return () => {
        sortable = undefined;
        registration.destroy();
      };
    },
  );
  createEffect(
    () => props.sortIndex,
    index => {
      if (sortable) sortable.index = index;
    },
  );
  onSettled(() => {
    const target = untrack(element);
    if (!target) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(target);
    return () => observer.disconnect();
  });

  const hasEnoughSpace = createMemo(() => width() >= 32);

  return (
    <WindowTab
      ref={setElement}
      id={props.id}
      index={props.index}
      appearance={props.appearance}
      active={props.active}
      accentMode={props.accentMode}
      tabIcon={props.tabIcon}
      class={props.manager ? modern.sortableInteraction : undefined}
      data-active-drag={props.dragging ? 'true' : undefined}
      data-tab-drop-target={props.dropTarget ? 'true' : undefined}
      role={props.manager ? 'group' : undefined}
      aria-label={props.manager ? props.tabName || undefined : undefined}
      tabindex={props.manager ? 0 : undefined}
      data-export-exclude={String(props.exportExclude)}
      data-host-index={props.index}
      style={assignInlineVars({
        [styles.tabVars.tabIndex]: String(props.index),
      })}
      onMouseDown={() => props.onClick?.()}
      onKeyDown={event => {
        if (event.target === event.currentTarget && event.key === 'Enter') {
          props.onClick?.();
        }
      }}
      content={
        <Show
          fallback={
            <Show
              when={props.appearance}
              fallback={
                <WindowTabContentText>{props.tabName}</WindowTabContentText>
              }
            >
              <span>{props.tabName || 'Untitled'}</span>
            </Show>
          }
          when={!props.readonlyTab}
        >
          <LoadingBoundary
            fallback={
              props.appearance ? (
                <span>{props.tabName || 'Untitled'}</span>
              ) : (
                <WindowTabContentText>{props.tabName}</WindowTabContentText>
              )
            }
          >
            <TabName
              readonly={props.readonlyTab && !props.active}
              value={props.tabName ?? ''}
              onValueChange={value => props.onTabChange?.(value)}
            />
          </LoadingBoundary>
        </Show>
      }
      rightContent={
        <Show when={props.onClose && hasEnoughSpace()}>
          <Show
            when={props.appearance}
            fallback={
              <CloseIcon
                class={styles.tabCloseIcon}
                data-tab-close
                onClick={(evt: MouseEvent) => {
                  props.onClose?.();
                  evt.stopPropagation();
                  evt.preventDefault();
                }}
                size={'xs'}
                stroke-width={3}
                data-export-exclude="true"
              />
            }
          >
            <TabCloseButton onClose={() => props.onClose?.()} />
          </Show>
        </Show>
      }
    />
  );
}
