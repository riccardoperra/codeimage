import {getRootEditorsState} from '@codeimage/store/editor';
import {For} from 'solid-js';
import {exportExclude as _exportExclude} from '../../../core/directives/exportExclude';
import {createTabIcon} from '../../../hooks/use-tab-icon';
import * as styles from './Tab.css';
import {TabAddButton} from './TabAddButton/TabAddButton';
import {WindowTab} from './WindowTab';

const exportExclude = _exportExclude;

export function WindowTabListManager() {
  const {
    tabs,
    editors,
    addEditor,
    isActive,
    removeEditor,
    setActiveEditor,
    setTabName,
  } = getRootEditorsState();

  return (
    <div
      class={styles.wrapper({
        multi: tabs.length > 0,
        accent: true,
      })}
    >
      <div class={styles.tabListWrapper}>
        <For each={tabs}>
          {(tab, index) => {
            const editor = editors[index()];

            const icon = createTabIcon(
              () => tab.tabName ?? null,
              () => editor.languageId,
              true,
            );

            const active = () => isActive(editor.id);

            return (
              <WindowTab
                tabName={tab.tabName}
                tabIcon={icon()?.content}
                readonlyTab={!active()}
                accentMode={false}
                active={active()}
                onClick={() => setActiveEditor(editor)}
                onTabChange={tabName => setTabName(tab.tabId, tabName)}
                onClose={() => removeEditor(editor.id)}
              />
            );
          }}
        </For>
      </div>
      <TabAddButton onAdd={() => addEditor(null, true)} />
    </div>
  );
}
