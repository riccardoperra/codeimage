import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {
  closestCenter,
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
} from '@thisbeyond/solid-dnd';
import {DragEventHandler} from '@thisbeyond/solid-dnd/dist/types/drag-drop-context';
import {createMemo, For, VoidProps} from 'solid-js';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import * as styles from './Tab.css';
import {TabAddButton} from './TabAddButton/TabAddButton';
import {WindowTab} from './WindowTab';

export interface WindowTabListManager {
  accent: boolean;
}

export function WindowTabListManager(props: VoidProps<WindowTabListManager>) {
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

  function handleDragEnd(handler: Parameters<DragEventHandler>[0]) {
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

  return (
    <div
      class={styles.wrapper({
        multi: editors.length > 0,
        accent: props.accent,
      })}
      data-accent-visible={props.accent}
    >
      <div class={styles.tabListWrapper}>
        <DragDropProvider
          onDragEnd={handleDragEnd}
          collisionDetector={closestCenter}
        >
          <DragDropSensors />
          <SortableProvider
            ids={createMemo(() => editors.map(editor => editor.id))()}
          >
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
                    return 20;
                  } else {
                    return 20 - (index() + 1);
                  }
                });

                return (
                  <WindowTab
                    id={editor.id}
                    index={zIndex()}
                    tabName={editor.tab.tabName}
                    tabIcon={icon()?.content}
                    readonlyTab={!active()}
                    accentMode={props.accent}
                    active={active()}
                    onClick={() => setActiveEditorId(editor.id)}
                    onTabChange={tabName => {
                      setTabName(editor.id, tabName, true);
                    }}
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
