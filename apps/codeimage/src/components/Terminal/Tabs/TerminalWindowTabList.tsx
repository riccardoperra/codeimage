import {getRootEditorStore} from '@codeimage/store/editor';
import type {DragEventParam} from '@core/modules/dnd';
import {ConstrainDragAxis} from '@core/modules/dnd/ConstrainDragAxis';
import {
  closestCorners,
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
} from '@thisbeyond/solid-dnd';
import type {VoidProps} from 'solid-js';
import {createMemo, ErrorBoundary, For, Show, Suspense} from 'solid-js';
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

export function TerminalWindowTabListContent(
  props: VoidProps<TerminalWindowTabListProps>,
) {
  let wrapperRef!: HTMLDivElement;

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

  const sortableIds = createMemo(() => editors().map(editor => editor.id));

  function handleDragEnd(handler: DragEventParam) {
    if (handler.draggable && handler.droppable) {
      const droppableId = handler.droppable.id;
      const draggableId = handler.draggable.id;
      const fromIndex = state.editors.findIndex(({id}) => id === draggableId);
      const toIndex = state.editors.findIndex(({id}) => id === droppableId);
      if (fromIndex !== toIndex) {
        const updatedItems = state.editors.slice();
        updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
        setEditors(updatedItems);
      }
    }
  }

  function handleTabNameChange(id: string, updatedName: string) {
    setTabName(id, updatedName, true);
  }

  return (
    <ErrorBoundary
      fallback={(e, reset) => {
        // Try to render again the content since @floating-ui/dom is broken?
        setTimeout(() => reset(), 100);
        return <></>;
      }}
    >
      <Suspense>
        <div
          class={
            props.appearance
              ? modern.wrapper
              : styles.wrapper({accent: props.accent, lite: props.lite})
          }
          data-window-tabs={props.appearance}
          data-accent-visible={props.accent}
        >
          <div
            class={props.appearance ? modern.list : styles.tabListWrapper}
            ref={wrapperRef}
          >
            <DragDropProvider
              onDragEnd={handleDragEnd}
              collisionDetector={closestCorners}
            >
              <DragDropSensors />
              <ConstrainDragAxis />
              <SortableProvider ids={sortableIds()}>
                <For each={editors()}>
                  {(editor, index) => {
                    const icon = createTabIcon(
                      () => editor.tab.tabName ?? null,
                      () => editor.languageId,
                      true,
                    );

                    const active = () => isActive(editor.id);

                    const zIndex = createMemo(() => {
                      if (active()) {
                        return 10;
                      } else {
                        return 10 - (index() + 1);
                      }
                    });

                    return (
                      <DraggableWindowTab
                        appearance={props.appearance}
                        exportExclude={
                          !editor.tab.tabName?.length &&
                          (state.editors.length === 1 || !active())
                        }
                        id={editor.id}
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
              </SortableProvider>
            </DragDropProvider>
          </div>
          <Show when={!props.readOnly}>
            <TabAddButton
              appearance={props.appearance}
              disabled={!canAddEditor()}
              onAdd={() => addEditor(null, true)}
            />
          </Show>
        </div>
      </Suspense>
    </ErrorBoundary>
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
      data-accent-visible={!props.appearance ? props.accent : undefined}
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
