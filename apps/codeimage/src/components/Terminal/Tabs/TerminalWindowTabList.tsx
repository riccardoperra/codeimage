import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {DragDropSensorsWithBoundary, DragEventParam} from '@core/modules/dnd';
import {
  closestCorners,
  DragDropProvider,
  SortableProvider,
} from '@thisbeyond/solid-dnd';
import {createMemo, For, VoidProps} from 'solid-js';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import * as styles from './Tab/Tab.css';
import {WindowTab} from './Tab/WindowTab';
import {TabAddButton} from './TabAddButton/TabAddButton';

export interface TerminalWindowTabListProps {
  accent: boolean;
}

export function TerminalWindowTabList(
  props: VoidProps<TerminalWindowTabListProps>,
) {
  let wrapperRef: HTMLDivElement;

  const {
    editors,
    actions: {
      addEditor,
      removeEditor,
      setActiveEditorId,
      setTabName,
      setEditors,
    },
    computed: {canAddEditor},
    isActive,
  } = getRootEditorStore();

  const sortableIds = createMemo(() => editors.map(editor => editor.id));

  function handleDragEnd(handler: DragEventParam) {
    if (handler.draggable && handler.droppable) {
      const droppableId = handler.droppable.id;
      const draggableId = handler.draggable.id;
      const fromIndex = editors.findIndex(({id}) => id === draggableId);
      const toIndex = editors.findIndex(({id}) => id === droppableId);
      if (fromIndex !== toIndex) {
        const updatedItems = editors.slice();
        updatedItems.splice(toIndex, 0, ...updatedItems.splice(fromIndex, 1));
        setEditors(updatedItems);
      }
    }
  }

  function handleTabNameChange(id: string, updatedName: string) {
    setTabName(id, updatedName, true);
  }

  return (
    <div
      class={styles.wrapper({accent: props.accent})}
      data-accent-visible={props.accent}
    >
      <div class={styles.tabListWrapper} ref={wrapperRef!}>
        {/* @ts-expect-error: TODO: Should update library types */}
        <DragDropProvider
          onDragEnd={handleDragEnd}
          collisionDetector={closestCorners}
        >
          <DragDropSensorsWithBoundary
            boundaryPadding={{left: 8, right: 8, top: 0, bottom: 0}}
            boundary={() => wrapperRef}
          />
          {/* @ts-expect-error: TODO: Should update library types */}
          <SortableProvider ids={sortableIds()}>
            <For each={editors}>
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
                  <WindowTab
                    exportExclude={
                      !editor.tab.tabName?.length &&
                      (editors.length === 1 || !active())
                    }
                    id={editor.id}
                    index={zIndex()}
                    tabName={editor.tab.tabName}
                    tabIcon={icon()?.content}
                    readonlyTab={!active()}
                    accentMode={props.accent}
                    active={active() && editors.length > 1}
                    onClick={() => setActiveEditorId(editor.id)}
                    onTabChange={tabName =>
                      handleTabNameChange(editor.id, tabName)
                    }
                    onClose={
                      editors.length > 1 ? () => removeEditor(editor.id) : null
                    }
                  />
                );
              }}
            </For>
          </SortableProvider>
        </DragDropProvider>
      </div>
      <TabAddButton
        disabled={!canAddEditor()}
        onAdd={() => addEditor(null, true)}
      />
    </div>
  );
}
