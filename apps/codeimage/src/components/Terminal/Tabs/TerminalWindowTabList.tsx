import {getRootEditorStore} from '@codeimage/store/editor';
import {DragEventParam} from '@core/modules/dnd';
import {ConstrainDragAxis} from '@core/modules/dnd/ConstrainDragAxis';
import {
  closestCorners,
  DragDropProvider,
  DragDropSensors,
  SortableProvider,
} from '@thisbeyond/solid-dnd';
import {
  createMemo,
  ErrorBoundary,
  For,
  Show,
  Suspense,
  VoidProps,
} from 'solid-js';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import {FrameSkeleton} from '../../Frame/FrameSkeleton';
import {DraggableWindowTab} from './Tab/DraggableWindowTab';
import * as styles from './Tab/Tab.css';
import {TabAddButton} from './TabAddButton/TabAddButton';
import {TerminalWindowTabListPreview} from './TerminalWindowTabListPreview';

export interface TerminalWindowTabListProps {
  accent: boolean;
  readOnly: boolean;
  lite?: boolean;
  preview?: boolean;
  small?: boolean;
}

export function TerminalWindowTabList(
  props: VoidProps<TerminalWindowTabListProps>,
) {
  // TODO: make reactive
  if (props.preview) {
    return <TerminalWindowTabListPreview {...props} />;
  }

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
    isActive,
  } = getRootEditorStore();

  const sortableIds = createMemo(() => state.editors.map(editor => editor.id));

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
        reset();
        return <></>;
      }}
    >
      <Suspense>
        <div
          class={styles.wrapper({accent: props.accent, lite: props.lite})}
          data-accent-visible={props.accent}
        >
          <div class={styles.tabListWrapper} ref={wrapperRef}>
            <DragDropProvider
              onDragEnd={handleDragEnd}
              collisionDetector={closestCorners}
            >
              <DragDropSensors />
              <ConstrainDragAxis />
              <SortableProvider ids={sortableIds()}>
                <For each={state.editors}>
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
                          state.editors.length > 1
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
              disabled={!canAddEditor()}
              onAdd={() => addEditor(null, true)}
            />
          </Show>
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
