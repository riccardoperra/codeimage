import {getRootEditorStore} from '@codeimage/store/editor';
import {createTabDragManager} from '@core/modules/dnd';
import type {DragDropManager, DragEndEvent} from '@dnd-kit/dom';
import type {VoidProps} from 'solid-js';
import {
  createEffect,
  createSignal,
  Errored,
  For,
  Show,
  Loading as LoadingBoundary,
} from 'solid-js';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import type {WindowStyle} from '../WindowStyles/WindowStyles';
import {WindowTab, WindowTabContentText} from './Tab/WindowTab';
import * as modern from './Tab/WindowTabStyle.css';
import {DraggableWindowTab} from './Tab/DraggableWindowTab';
import * as styles from './Tab/Tab.css';
import {TabAddButton} from './TabAddButton/TabAddButton';
import {TerminalWindowTabListPreview} from './TerminalWindowTabListPreview';

export interface TerminalWindowTabListProps {
  appearance?: WindowStyle;
  accent: boolean;
  readOnly: boolean;
  lite?: boolean;
  preview?: boolean;
  small?: boolean;
  showOnlyActiveTab?: boolean;
  activeTabId?: string;
  fixedTabs?: boolean;
}

export function TerminalWindowTabList(
  props: VoidProps<TerminalWindowTabListProps>,
) {
  return (
    <>
      {props.fixedTabs ||
      (props.appearance && (props.readOnly || props.preview)) ? (
        <StaticWindowTabs {...props} />
      ) : props.preview ? (
        <TerminalWindowTabListPreview {...props} />
      ) : (
        <TerminalWindowTabListContent {...props} />
      )}
    </>
  );
}

function TerminalWindowTabListContent(
  props: VoidProps<TerminalWindowTabListProps>,
) {
  const {
    state,
    actions: {
      addEditor,
      removeEditor,
      setActiveEditorId,
      setTabName,
      setEditors,
    },
    computed: {canAddEditor},
    isActive: isStoreActive,
  } = getRootEditorStore();

  const isActive = (id: string) =>
    props.activeTabId ? id === props.activeTabId : isStoreActive(id);

  const editors = () => {
    if (props.showOnlyActiveTab) {
      return state.editors.filter(editor => isActive(editor.id));
    }
    return state.editors;
  };

  const [manager, setManager] = createSignal<DragDropManager>();
  const [dragSource, setDragSource] = createSignal<string | number>();
  const [dropTarget, setDropTarget] = createSignal<string | number>();

  function handleDragEnd({canceled, operation}: DragEndEvent) {
    setDragSource(undefined);
    setDropTarget(undefined);
    const {source, target, activatorEvent} = operation;
    if (!source) return;

    if (!canceled && target && source.id !== target.id) {
      const fromIndex = state.editors.findIndex(({id}) => id === source.id);
      const toIndex = state.editors.findIndex(({id}) => id === target.id);
      if (fromIndex >= 0 && toIndex >= 0) {
        const updatedItems = state.editors.slice();
        updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
        setEditors(updatedItems);
      }
    }

    const element = source.element;
    if (
      activatorEvent instanceof KeyboardEvent &&
      element instanceof HTMLElement
    ) {
      element.focus({preventScroll: true});
    }
  }

  createEffect(
    () => props.readOnly || !!props.showOnlyActiveTab,
    disabled => {
      if (disabled) return;
      const dragManager = createTabDragManager();
      dragManager.monitor.addEventListener('dragstart', ({operation}) =>
        setDragSource(operation.source?.id),
      );
      dragManager.monitor.addEventListener('dragover', ({operation}) =>
        setDropTarget(operation.target?.id),
      );
      let pendingDrop: number | undefined;
      dragManager.monitor.addEventListener('dragend', event => {
        pendingDrop = requestAnimationFrame(() => handleDragEnd(event));
      });
      setManager(dragManager);
      return () => {
        if (pendingDrop !== undefined) cancelAnimationFrame(pendingDrop);
        setManager(undefined);
        setDragSource(undefined);
        setDropTarget(undefined);
        dragManager.destroy();
      };
    },
  );

  function handleTabNameChange(id: string, updatedName: string) {
    setTabName(id, updatedName, true);
  }

  return (
    <Errored
      fallback={(e, reset) => {
        setTimeout(() => reset(), 100);
        return <></>;
      }}
    >
      <LoadingBoundary>
        <div
          class={
            props.appearance
              ? modern.wrapper
              : styles.wrapper({accent: props.accent, lite: props.lite})
          }
          data-window-tabs={props.appearance}
          data-accent-visible={String(props.accent)}
        >
          <div class={props.appearance ? modern.list : styles.tabListWrapper}>
            <For each={editors()}>
              {(editor, index) => {
                const icon = createTabIcon(
                  () => editor.tab.tabName ?? null,
                  () => editor.languageId,
                  true,
                );

                const active = () => isActive(editor.id);

                const zIndex = () => (active() ? 10 : 9 - index());

                return (
                  <DraggableWindowTab
                    appearance={props.appearance}
                    exportExclude={
                      !editor.tab.tabName?.length &&
                      (state.editors.length === 1 || !active())
                    }
                    id={editor.id}
                    manager={manager()}
                    sortIndex={index()}
                    dragging={dragSource() === editor.id}
                    dropTarget={
                      dropTarget() === editor.id && dragSource() !== editor.id
                    }
                    index={zIndex()}
                    tabName={editor.tab.tabName}
                    tabIcon={icon()?.content}
                    readonlyTab={props.readOnly || !active()}
                    accentMode={props.accent}
                    active={active()}
                    onClick={() => setActiveEditorId(editor.id)}
                    onTabChange={tabName =>
                      handleTabNameChange(editor.id, tabName)
                    }
                    onClose={
                      !props.readOnly && state.editors.length > 1
                        ? () => removeEditor(editor.id)
                        : null
                    }
                  />
                );
              }}
            </For>
          </div>
          <Show when={!props.readOnly}>
            <TabAddButton
              appearance={props.appearance}
              disabled={!canAddEditor()}
              onAdd={() => addEditor(null, true)}
            />
          </Show>
        </div>
      </LoadingBoundary>
    </Errored>
  );
}

function StaticWindowTabs(props: TerminalWindowTabListProps) {
  const editor = getRootEditorStore();
  const active = (id: string) =>
    props.activeTabId ? id === props.activeTabId : editor.isActive(id);
  const tabs = () =>
    editor.state.editors.filter(
      tab =>
        (!props.showOnlyActiveTab || active(tab.id)) &&
        (!props.appearance ||
          props.appearance === 'editor' ||
          !!tab.tab.tabName),
    );
  return (
    <div
      class={
        props.appearance
          ? modern.wrapper
          : styles.wrapper({accent: props.accent, lite: props.lite})
      }
      data-window-tabs={props.appearance}
      data-accent-visible={!props.appearance ? String(props.accent) : undefined}
    >
      <div class={props.appearance ? modern.list : styles.tabListWrapper}>
        <For each={tabs()}>
          {(tab, index) => {
            const icon = createTabIcon(
              () => tab.tab.tabName ?? null,
              () => tab.languageId,
              true,
            );
            return (
              <WindowTab
                appearance={props.appearance}
                active={active(tab.id)}
                accentMode={props.appearance ? false : props.accent}
                tabIcon={icon()?.content}
                index={
                  props.appearance
                    ? 0
                    : active(tab.id)
                      ? 10
                      : 10 - (index() + 1)
                }
                content={
                  props.appearance ? (
                    <span>{tab.tab.tabName || 'Untitled'}</span>
                  ) : (
                    <WindowTabContentText>
                      {tab.tab.tabName}
                    </WindowTabContentText>
                  )
                }
              />
            );
          }}
        </For>
      </div>
    </div>
  );
}
