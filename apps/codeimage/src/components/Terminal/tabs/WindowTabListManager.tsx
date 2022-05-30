import {getRootEditorStore} from '@codeimage/store/editor/createEditors';
import {For, VoidProps} from 'solid-js';
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
    actions: {addEditor, removeEditor, setActiveEditorId, setTabName},
    isActive,
  } = getRootEditorStore();

  return (
    <div
      class={styles.wrapper({
        multi: editors.length > 0,
        accent: props.accent,
      })}
      data-accent-visible={props.accent}
    >
      <div class={styles.tabListWrapper}>
        <For each={editors}>
          {editor => {
            const icon = createTabIcon(
              () => editor.tab.tabName ?? null,
              () => editor.languageId,
              true,
            );

            const active = () => isActive(editor.id);

            return (
              <WindowTab
                tabName={editor.tab.tabName}
                tabIcon={icon()?.content}
                readonlyTab={!active()}
                accentMode={props.accent}
                active={active()}
                onClick={() => setActiveEditorId(editor.id)}
                onTabChange={tabName => setTabName(editor.id, tabName)}
                onClose={
                  editors.length > 1 ? () => removeEditor(editor.id) : null
                }
              />
            );
          }}
        </For>
      </div>
      <TabAddButton onAdd={() => addEditor(null, true)} />
    </div>
  );
}
